import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import { downloadFile } from "@/lib/drive/service";

type RouteProps = {
  params: Promise<{ fileId: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { fileId } = await params;
  if (!fileId) {
    return NextResponse.json({ error: "fileId is required." }, { status: 400 });
  }

  try {
    const response = await downloadFile(fileId);
    const contentType = response.headers["content-type"] ?? "application/octet-stream";
    const stream = response.data as Readable;

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=120, s-maxage=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load file from Google Drive." }, { status: 500 });
  }
}
