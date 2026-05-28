import { NextResponse } from "next/server";

import { uploadChunkToResumableSession } from "@/lib/drive/service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadUrl = String(formData.get("uploadUrl") ?? "").trim();
    const mimeType = String(formData.get("mimeType") ?? "").trim();
    const startByte = Number(formData.get("startByte") ?? 0);
    const endByte = Number(formData.get("endByte") ?? 0);
    const totalBytes = Number(formData.get("totalBytes") ?? 0);
    const chunk = formData.get("chunk");

    if (!(chunk instanceof File)) {
      return NextResponse.json({ error: "chunk file is required." }, { status: 400 });
    }

    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadChunkToResumableSession({
      uploadUrl,
      mimeType,
      startByte,
      endByte,
      totalBytes,
      chunk: buffer,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload chunk failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
