import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

import { listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  if (!isRoomKey(roomId)) {
    notFound();
  }

  const room = getRoomById(roomId);
  if (!room) {
    notFound();
  }

  const folderId = process.env[room.envFolderKey];
  if (!folderId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-amber-900">{room.name}</h1>
          <p className="mt-3 text-sm leading-6 text-amber-800">
            방 폴더 환경변수가 설정되지 않았습니다. `{room.envFolderKey}` 값을 Vercel 환경변수에 넣어 주세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-xl border border-amber-400 px-4 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          >
            코드 입력 화면으로
          </Link>
        </section>
      </main>
    );
  }

  const photos = await listRecentPhotosFromFolder(folderId, 48);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8">
      <section className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{room.name}</h1>
          <p className="mt-2 text-sm text-stone-600">최근 사진 {photos.length}장</p>
          <Link
            href="/"
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            코드 입력 화면으로
          </Link>
        </div>

        {photos.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-8 text-sm text-stone-600 shadow-sm">
            아직 표시할 사진이 없습니다. Google Drive의 방 폴더에 이미지를 올린 뒤 새로고침해 주세요.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
    </main>
  );
}
