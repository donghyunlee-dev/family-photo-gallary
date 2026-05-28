import { notFound, redirect } from "next/navigation";

import RoomDashboardManager from "@/components/room/room-dashboard-manager";
import { getAuthorizedRoomId } from "@/lib/auth/session";
import { MOCK_ROOM_FOLDERS, MOCK_ROOM_PHOTOS } from "@/lib/gallery/mock-data";
import { listFoldersFromFolder, listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

export const dynamic = "force-dynamic";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ mock?: string }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const { mock } = await searchParams;
  const useMock = mock === "1";

  if (!isRoomKey(roomId)) notFound();

  const room = getRoomById(roomId);
  if (!room) notFound();

  if (!useMock) {
    const authorizedRoomId = await getAuthorizedRoomId();
    if (authorizedRoomId !== roomId) {
      redirect("/");
    }
  }

  const roomFolderId = process.env[room.envFolderKey];

  if (useMock) {
    return (
      <div className="min-h-dvh bg-background">
        <RoomDashboardManager
          roomId={roomId}
          roomName={room.name}
          roomRootFolderId="mock-room-root"
          photos={MOCK_ROOM_PHOTOS}
          folders={MOCK_ROOM_FOLDERS}
          isMock
        />
      </div>
    );
  }

  if (!roomFolderId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="card max-w-sm p-6">
          <h1 className="font-serif text-lg font-semibold text-[color:var(--foreground)]">{room.name}</h1>
          <p className="mt-2 text-sm text-[color:var(--foreground-secondary)]">
            방 폴더 환경변수가 설정되지 않았습니다. <code>{room.envFolderKey}</code> 값을 Vercel 환경변수에 추가해 주세요.
          </p>
        </div>
      </main>
    );
  }

  let photos: Awaited<ReturnType<typeof listRecentPhotosFromFolder>> = [];
  let folders: Awaited<ReturnType<typeof listFoldersFromFolder>> = [];
  let loadError = "";

  try {
    [photos, folders] = await Promise.all([
      listRecentPhotosFromFolder(roomFolderId, 24),
      listFoldersFromFolder(roomFolderId, 50),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    loadError = `Google Drive에서 데이터를 불러오지 못했습니다. ${message}`;
  }

  return (
    <div className="min-h-dvh bg-background">
      {loadError ? (
        <main className="flex min-h-dvh items-center justify-center px-4">
          <div className="card max-w-sm p-6 text-sm text-[color:var(--danger)]">{loadError}</div>
        </main>
      ) : (
        <RoomDashboardManager
          roomId={roomId}
          roomName={room.name}
          roomRootFolderId={roomFolderId}
          photos={photos.map((photo) => ({ id: photo.id, name: photo.name }))}
          folders={folders.map((folder) => ({ id: folder.id, name: folder.name }))}
        />
      )}
    </div>
  );
}

