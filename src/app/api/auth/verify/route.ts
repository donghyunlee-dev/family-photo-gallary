import { NextResponse } from "next/server";

import { getRoomByCode } from "@/lib/room/config";

type VerifyRequest = {
  code?: string;
};

export async function POST(request: Request) {
  let body: VerifyRequest;

  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const code = body.code?.trim();

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "6자리 숫자 코드를 입력해 주세요." }, { status: 400 });
  }

  const room = getRoomByCode(code);

  if (!room) {
    return NextResponse.json({ error: "올바르지 않은 코드입니다." }, { status: 401 });
  }

  return NextResponse.json({ roomId: room.id, roomName: room.name }, { status: 200 });
}
