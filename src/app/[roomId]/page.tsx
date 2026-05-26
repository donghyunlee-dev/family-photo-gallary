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
      <main className="paper-bg flex min-h-screen items-center justify-center px-4 py-12">
        <section className="gallery-paper w-full max-w-xl rounded-3xl p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-amber-900">{room.name}</h1>
          <p className="mt-3 text-sm leading-6 text-amber-800">
            ¹æ Æú´õ È¯°æº¯¼ö°¡ ¼³Á¤µÇÁö ¾Ê¾Ò½À´Ï´Ù. `{room.envFolderKey}` °ªÀ» Vercel È¯°æº¯¼ö¿¡ ³Ö¾î ÁÖ¼¼¿ä.
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
    loadError = `Google Drive¿¡¼­ µ¥ÀÌÅÍ¸¦ ºÒ·¯¿ÀÁö ¸øÇß½À´Ï´Ù: ${message}`;
  }

  return (
    <main className="paper-bg min-h-screen px-4 py-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        {loadError ? (
          <div className="gallery-paper rounded-3xl border border-red-200 bg-red-50/90 p-8 text-sm text-red-700">
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
