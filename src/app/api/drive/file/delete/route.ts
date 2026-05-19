import { NextResponse } from "next/server";

import { deleteFileById } from "@/lib/drive/service";

type DeleteBody = {
  fileIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DeleteBody;
    const fileIds = (body.fileIds ?? []).map((id) => id.trim()).filter(Boolean);

    if (fileIds.length === 0) {
      return NextResponse.json({ error: "fileIds is required." }, { status: 400 });
    }

    await Promise.all(fileIds.map((fileId) => deleteFileById(fileId)));
    return NextResponse.json({ deletedCount: fileIds.length }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
