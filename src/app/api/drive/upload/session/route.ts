import { NextResponse } from "next/server";

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
    const message = error instanceof Error ? error.message : "Upload session failed.";

    if (message.includes("invalid_client")) {
      return NextResponse.json(
        {
          error:
            "Google OAuth 인증 정보가 올바르지 않습니다. Vercel의 GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN 값을 다시 확인해 주세요.",
        },
        { status: 500 },
      );
    }

    if (message.includes("storage quota") || message.includes("insufficientFilePermissions")) {
      return NextResponse.json(
        {
          error:
            "Google Drive 권한 또는 용량 문제입니다. OAuth 계정의 Drive 권한과 대상 폴더 편집 권한을 확인해 주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
