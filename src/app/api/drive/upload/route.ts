import { NextResponse } from "next/server";

import { uploadPhotoToFolder } from "@/lib/drive/service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const folderId = String(formData.get("folderId") ?? "").trim();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required." }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files selected." }, { status: 400 });
    }

    const tasks = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return uploadPhotoToFolder({
        folderId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
      });
    });

    const uploaded = await Promise.all(tasks);
    return NextResponse.json({ uploadedCount: uploaded.length }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";

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
