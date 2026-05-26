import { NextResponse } from "next/server";

import { createFolderInFolder } from "@/lib/drive/service";

type CreateFolderBody = {
  parentFolderId?: string;
  folderName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateFolderBody;
    const parentFolderId = body.parentFolderId?.trim() ?? "";
    const folderName = body.folderName?.trim() ?? "";

    if (!parentFolderId) {
      return NextResponse.json({ error: "parentFolderId is required." }, { status: 400 });
    }

    if (!folderName) {
      return NextResponse.json({ error: "folderName is required." }, { status: 400 });
    }

    const created = await createFolderInFolder({ parentFolderId, folderName });
    return NextResponse.json({ folder: created }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Folder create failed.";
    if (message.includes("invalid_client")) {
      return NextResponse.json(
        {
          error:
            "Google OAuth 인증 정보가 올바르지 않습니다. Vercel의 GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN 값을 다시 확인해 주세요.",
        },
        { status: 500 },
      );
    }
    if (message.includes("insufficientFilePermissions") || message.includes("File not found")) {
      return NextResponse.json(
        {
          error:
            "대상 폴더에 대한 Google Drive 편집 권한이 없습니다. OAuth 계정이 해당 폴더의 편집자로 추가되어 있는지 확인해 주세요.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
