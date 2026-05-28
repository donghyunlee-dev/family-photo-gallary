import { cookies } from "next/headers";

import type { RoomKey } from "@/lib/room/config";
import { isRoomKey } from "@/lib/room/config";

export const ROOM_SESSION_COOKIE = "family-photo-room";

export function createRoomSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function getAuthorizedRoomId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ROOM_SESSION_COOKIE)?.value;
  return value && isRoomKey(value) ? value : null;
}

export async function isAuthorizedRoom(roomId: RoomKey) {
  const authorizedRoomId = await getAuthorizedRoomId();
  return authorizedRoomId === roomId;
}

