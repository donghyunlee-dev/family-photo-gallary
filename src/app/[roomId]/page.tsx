import Link from "next/link";
import { notFound } from "next/navigation";

import { ROOM_DEFINITIONS, isRoomKey } from "@/lib/room/config";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  if (!isRoomKey(roomId)) {
    notFound();
  }

  const room = ROOM_DEFINITIONS.find((value) => value.id === roomId);
  if (!room) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{room.name}</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          입장 확인이 완료되었습니다. 다음 단계에서 이 방에 최근 사진 갤러리와 폴더 목록을 연결합니다.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          코드 입력 화면으로
        </Link>
      </section>
    </main>
  );
}
