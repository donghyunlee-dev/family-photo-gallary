import Link from "next/link";
import { notFound } from "next/navigation";

import FolderPhotoManager from "@/components/gallery/folder-photo-manager";
import { listFoldersFromFolder, listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

type FolderPageProps = {
  params: Promise<{ roomId: string; folderId: string }>;
};

export default async function FolderPage({ params }: FolderPageProps) {
  const { roomId, folderId } = await params;
  if (!isRoomKey(roomId)) notFound();
  if (!folderId) notFound();

  const room = getRoomById(roomId);
  if (!room) notFound();
  const roomRootFolderId = process.env[room.envFolderKey];
  if (!roomRootFolderId) notFound();

  let photos: Awaited<ReturnType<typeof listRecentPhotosFromFolder>> = [];
  let moveTargets: Awaited<ReturnType<typeof listFoldersFromFolder>> = [];
  let loadError = "";

  try {
    [photos, moveTargets] = await Promise.all([
      listRecentPhotosFromFolder(folderId, 120),
      listFoldersFromFolder(roomRootFolderId, 100),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    loadError = `폴더 데이터를 불러오지 못했습니다: ${message}`;
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">폴더 상세</h1>
          <p className="mt-2 text-sm text-stone-600">사진 {photos.length}장</p>
          <Link
            href={`/${roomId}`}
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            방으로 돌아가기
          </Link>
        </div>

        {loadError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
            {loadError}
          </div>
        ) : null}

        {!loadError ? (
          photos.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 text-sm text-stone-600 shadow-sm">
              이 폴더에는 아직 사진이 없습니다.
            </div>
          ) : (
            <FolderPhotoManager
              photos={photos.map((photo) => ({ id: photo.id, name: photo.name }))}
              roomId={roomId}
              currentFolderId={folderId}
              roomRootFolderId={roomRootFolderId}
              moveTargets={moveTargets.map((folder) => ({ id: folder.id, name: folder.name }))}
            />
          )
        ) : null}
      </section>
    </main>
  );
}
