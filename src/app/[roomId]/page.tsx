import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import UploadForm from "@/components/upload/upload-form";
import { listFoldersFromFolder, listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

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
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{room.name}</h1>
          <p className="mt-2 text-sm text-stone-600">
            최근 사진 {photos.length}장 · 폴더 {folders.length}개
          </p>
          <div className="mt-4">
            <UploadForm folderId={roomFolderId} folderName={room.name} />
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            코드 입력 화면으로
          </Link>
        </div>

        {loadError ? <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">{loadError}</div> : null}

        {!loadError ? (
          <>
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">최근 사진</h2>
              {photos.length === 0 ? (
                <p className="mt-3 text-sm text-stone-600">아직 표시할 사진이 없습니다.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((photo) => (
                    <article key={photo.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                      <Image
                        src={`/api/drive/file/${photo.id}`}
                        alt={photo.name}
                        width={640}
                        height={440}
                        className="h-44 w-full object-cover"
                        unoptimized
                      />
                      <div className="px-3 py-2">
                        <p className="truncate text-xs text-stone-700">{photo.name}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">폴더 목록</h2>
              {folders.length === 0 ? (
                <p className="mt-3 text-sm text-stone-600">아직 생성된 폴더가 없습니다.</p>
              ) : (
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {folders.map((folder) => (
                    <li key={folder.id}>
                      <Link
                        href={`/${roomId}/folder/${folder.id}`}
                        className="block rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 transition hover:bg-stone-100"
                      >
                        <p className="truncate text-sm font-medium text-stone-900">{folder.name}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          생성일 {new Date(folder.createdTime).toLocaleDateString("ko-KR")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
