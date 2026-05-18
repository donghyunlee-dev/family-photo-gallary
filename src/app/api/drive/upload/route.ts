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
    if (message.includes("Service Accounts do not have storage quota")) {
      return NextResponse.json(
        {
          error:
            "서비스계정 업로드 quota 오류입니다. 대상 폴더를 Shared Drive로 옮기거나, 사용자 OAuth(위임) 방식으로 전환이 필요합니다.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
