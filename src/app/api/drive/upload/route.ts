import { NextResponse } from "next/server";

import { getDriveErrorDetails } from "@/lib/drive/errors";
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

    const uploaded = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const saved = await uploadPhotoToFolder({
        folderId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
      });
      uploaded.push(saved);
    }

    return NextResponse.json({ uploadedCount: uploaded.length }, { status: 200 });
  } catch (error) {
    const details = getDriveErrorDetails(error);
    return NextResponse.json({ error: details.publicMessage, code: details.code }, { status: details.status });
  }
}
