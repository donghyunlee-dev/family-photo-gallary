export type RoomKey = "our-family" | "my-parents-family" | "wife-parents-family";

export type RoomDefinition = {
  id: RoomKey;
  name: string;
  envCodeKey:
    | "ROOM_CODE_OUR_FAMILY"
    | "ROOM_CODE_MY_PARENTS"
    | "ROOM_CODE_WIFE_PARENTS";
  envFolderKey:
    | "DRIVE_FOLDER_OUR_FAMILY"
    | "DRIVE_FOLDER_MY_PARENTS"
    | "DRIVE_FOLDER_WIFE_PARENTS";
};

export const ROOM_DEFINITIONS: readonly RoomDefinition[] = [
  {
    id: "our-family",
    name: "우리 가족 사진방",
    envCodeKey: "ROOM_CODE_OUR_FAMILY",
    envFolderKey: "DRIVE_FOLDER_OUR_FAMILY",
  },
  {
    id: "my-parents-family",
    name: "내 부모님 가족 사진방",
    envCodeKey: "ROOM_CODE_MY_PARENTS",
    envFolderKey: "DRIVE_FOLDER_MY_PARENTS",
  },
  {
    id: "wife-parents-family",
    name: "처가 부모님 가족 사진방",
    envCodeKey: "ROOM_CODE_WIFE_PARENTS",
    envFolderKey: "DRIVE_FOLDER_WIFE_PARENTS",
  },
] as const;

export function getRoomByCode(code: string) {
  return ROOM_DEFINITIONS.find((room) => process.env[room.envCodeKey] === code) ?? null;
}

export function isRoomKey(value: string): value is RoomKey {
  return ROOM_DEFINITIONS.some((room) => room.id === value);
}

export function getRoomById(roomId: RoomKey) {
  return ROOM_DEFINITIONS.find((room) => room.id === roomId) ?? null;
}
