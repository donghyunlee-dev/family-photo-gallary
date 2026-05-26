import { notFound } from "next/navigation";

import RoomDashboardManager from "@/components/room/room-dashboard-manager";
import { listFoldersFromFolder, listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

export const dynamic = "force-dynamic";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  if (!isRoomKey(roomId)) notFound();

  const room = getRoomById(roomId);
  if (!room) notFound();

  const roomFolderId = process.env[room.envFolderKey];
  if (!roomFolderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-amber-900">{room.name}</h1>
          <p className="mt-3 text-sm leading-6 text-amber-800">
            방 폴더 환경변수가 설정되지 않았습니다. `{room.envFolderKey}` 값을 Vercel 환경변수에 넣어 주세요.
          </p>
        </section>
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
    loadError = `Google Drive에서 데이터를 불러오지 못했습니다: ${message}`;
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        {loadError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
            {loadError}
          </div>
        ) : (
          <RoomDashboardManager
            roomId={roomId}
            roomName={room.name}
            roomRootFolderId={roomFolderId}
            photos={photos.map((photo) => ({ id: photo.id, name: photo.name }))}
            folders={folders.map((folder) => ({ id: folder.id, name: folder.name }))}
          />
        )}
      </section>
    </main>
  );
}
