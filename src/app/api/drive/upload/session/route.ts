import { NextResponse } from "next/server";

import { getDriveErrorDetails } from "@/lib/drive/errors";
import { createResumableUploadSession } from "@/lib/drive/service";

type UploadSessionRequest = {
  fileName?: string;
  fileSize?: number;
  folderId?: string;
  mimeType?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UploadSessionRequest;
    const folderId = String(body.folderId ?? "").trim();
    const fileName = String(body.fileName ?? "").trim();
    const mimeType = String(body.mimeType ?? "").trim();
    const fileSize = Number(body.fileSize ?? 0);

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required." }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required." }, { status: 400 });
    }

    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "fileSize must be greater than 0." }, { status: 400 });
    }

    const session = await createResumableUploadSession({
      folderId,
      fileName,
      mimeType,
      fileSize,
    });

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    const details = getDriveErrorDetails(error);
    return NextResponse.json({ error: details.publicMessage, code: details.code }, { status: details.status });
  }
}
