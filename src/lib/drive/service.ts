import { google } from "googleapis";

export type DrivePhoto = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
};

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

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
  const drive = createDriveClient();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    orderBy: "createdTime desc",
    pageSize: limit,
    fields: "files(id,name,mimeType,createdTime)",
  });

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
