import { NextResponse } from "next/server";

import { getDriveErrorDetails } from "@/lib/drive/errors";
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
    const details = getDriveErrorDetails(error);
    return NextResponse.json({ error: details.publicMessage, code: details.code }, { status: details.status });
  }
}
