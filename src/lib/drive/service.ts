import { google } from "googleapis";

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

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];

function createAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account env vars are missing.");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: DRIVE_SCOPES,
  });
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
    { fileId, alt: "media" },
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
        body: buffer,
      },
      fields: "id,name,mimeType,createdTime",
    });

    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown drive error";
    throw new Error(`drive.files.create failed (${message})`);
  }
}
