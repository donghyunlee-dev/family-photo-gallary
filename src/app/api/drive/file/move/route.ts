import { NextResponse } from "next/server";

import { moveFileToFolder } from "@/lib/drive/service";

type MoveBody = {
  fileId?: string;
  fromFolderId?: string;
  toFolderId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MoveBody;
    const fileId = body.fileId?.trim() ?? "";
    const fromFolderId = body.fromFolderId?.trim() ?? "";
    const toFolderId = body.toFolderId?.trim() ?? "";

    if (!fileId || !fromFolderId || !toFolderId) {
      return NextResponse.json(
        { error: "fileId, fromFolderId, toFolderId are required." },
        { status: 400 },
      );
    }

    const moved = await moveFileToFolder({ fileId, fromFolderId, toFolderId });
    return NextResponse.json({ moved }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Move failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
