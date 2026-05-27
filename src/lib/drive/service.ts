import { google } from "googleapis";
import { Readable } from "node:stream";

export type DrivePhoto = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
};

export type DriveFolder = {
  id: string;
  name: string;
  createdTime: string;
};

function createAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google OAuth env vars are missing.");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function getAccessToken() {
  const auth = createAuth();
  const token = await auth.getAccessToken();
  const value = typeof token === "string" ? token : token?.token;

  if (!value) {
    throw new Error("Failed to acquire Google OAuth access token.");
  }

  return value;
}

function createDriveClient() {
  return google.drive({
    version: "v3",
    auth: createAuth(),
  });
}

export async function listRecentPhotosFromFolder(folderId: string, limit = 30): Promise<DrivePhoto[]> {
  if (!folderId.trim()) {
    throw new Error("folderId is empty.");
  }

  const drive = createDriveClient();
  let response;
  try {
    response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      orderBy: "createdTime desc",
      pageSize: limit,
      fields: "files(id,name,mimeType,createdTime)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.list failed (${message})`);
  }

  return (response.data.files ?? [])
    .filter((file): file is Required<Pick<DrivePhoto, "id" | "name" | "mimeType" | "createdTime">> =>
      Boolean(file.id && file.name && file.mimeType && file.createdTime),
    )
    .map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      createdTime: file.createdTime,
    }));
}

export async function downloadFile(fileId: string) {
  const drive = createDriveClient();
  return drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" },
  );
}

export async function listFoldersFromFolder(parentFolderId: string, limit = 50): Promise<DriveFolder[]> {
  if (!parentFolderId.trim()) {
    throw new Error("parentFolderId is empty.");
  }

  const drive = createDriveClient();
  let response;
  try {
    response = await drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      orderBy: "createdTime desc",
      pageSize: limit,
      fields: "files(id,name,createdTime)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.list folders failed (${message})`);
  }

  return (response.data.files ?? [])
    .filter((file): file is Required<Pick<DriveFolder, "id" | "name" | "createdTime">> =>
      Boolean(file.id && file.name && file.createdTime),
    )
    .map((file) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
    }));
}

export async function uploadPhotoToFolder(input: {
  folderId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const { folderId, fileName, mimeType, buffer } = input;
  if (!folderId.trim()) throw new Error("folderId is empty.");
  if (!fileName.trim()) throw new Error("fileName is empty.");
  if (!mimeType.startsWith("image/")) throw new Error("Only image files are allowed.");

  const drive = createDriveClient();
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: "id,name,mimeType,createdTime",
      supportsAllDrives: true,
    });

    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.create failed (${message})`);
  }
}

export async function createResumableUploadSession(input: {
  folderId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  const { folderId, fileName, mimeType, fileSize } = input;

  if (!folderId.trim()) throw new Error("folderId is empty.");
  if (!fileName.trim()) throw new Error("fileName is empty.");
  if (!mimeType.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (!Number.isFinite(fileSize) || fileSize <= 0) throw new Error("fileSize must be greater than 0.");

  const accessToken = await getAccessToken();
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": String(fileSize),
      },
      body: JSON.stringify({
        name: fileName,
        parents: [folderId],
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`drive resumable session failed (${response.status}: ${body || response.statusText})`);
  }

  const uploadUrl = response.headers.get("location");
  if (!uploadUrl) {
    throw new Error("Google Drive did not return a resumable upload URL.");
  }

  return { uploadUrl };
}

export async function createFolderInFolder(input: { parentFolderId: string; folderName: string }) {
  const { parentFolderId, folderName } = input;
  if (!parentFolderId.trim()) throw new Error("parentFolderId is empty.");
  if (!folderName.trim()) throw new Error("folderName is empty.");

  const drive = createDriveClient();
  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName.trim(),
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id,name,createdTime",
      supportsAllDrives: true,
    });

    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.create folder failed (${message})`);
  }
}

export async function moveFileToFolder(input: {
  fileId: string;
  fromFolderId: string;
  toFolderId: string;
}) {
  const { fileId, fromFolderId, toFolderId } = input;
  if (!fileId.trim()) throw new Error("fileId is empty.");
  if (!fromFolderId.trim()) throw new Error("fromFolderId is empty.");
  if (!toFolderId.trim()) throw new Error("toFolderId is empty.");

  const drive = createDriveClient();
  try {
    const response = await drive.files.update({
      fileId,
      addParents: toFolderId,
      removeParents: fromFolderId,
      fields: "id,name,parents",
      supportsAllDrives: true,
    });
    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.update move failed (${message})`);
  }
}

export async function deleteFileById(fileId: string) {
  if (!fileId.trim()) throw new Error("fileId is empty.");

  const drive = createDriveClient();
  try {
    await drive.files.update({
      fileId,
      requestBody: { trashed: true },
      supportsAllDrives: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.update trash failed (${message})`);
  }
}
