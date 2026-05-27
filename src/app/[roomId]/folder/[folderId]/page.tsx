import Link from "next/link";
import { notFound } from "next/navigation";

import FolderPhotoManager from "@/components/gallery/folder-photo-manager";
import { listFoldersFromFolder, listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

export const dynamic = "force-dynamic";

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
  let childFolders: Awaited<ReturnType<typeof listFoldersFromFolder>> = [];
  let loadError = "";

  try {
    [photos, moveTargets, childFolders] = await Promise.all([
      listRecentPhotosFromFolder(folderId, 120),
      listFoldersFromFolder(roomRootFolderId, 100),
      listFoldersFromFolder(folderId, 100),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    loadError = `폴더 데이터를 불러오지 못했습니다: ${message}`;
  }
  const currentFolderName = moveTargets.find((f) => f.id === folderId)?.name ?? "현재 폴더";

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Top bar ── */}
      <header className="topbar px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-semibold text-[color:var(--foreground)] leading-tight">
              {currentFolderName}
            </h1>
            <p className="text-[11px] text-[color:var(--foreground-secondary)]">
              사진 {photos.length}장
            </p>
          </div>
          <Link
            href={`/${roomId}`}
            aria-label="뒤로 가기"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-secondary)] transition hover:bg-[color:var(--accent-light)]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* spacer */}
      <div style={{ height: "var(--header-h)" }} aria-hidden />

      {loadError ? (
        <div className="flex items-center justify-center p-6">
          <div className="card max-w-sm p-5 text-sm text-[color:var(--danger)]">{loadError}</div>
        </div>
      ) : (
        <FolderPhotoManager
          photos={photos.map((p) => ({ id: p.id, name: p.name }))}
          roomId={roomId}
          currentFolderId={folderId}
          roomRootFolderId={roomRootFolderId}
          moveTargets={moveTargets.map((f) => ({ id: f.id, name: f.name }))}
          childFolders={childFolders.map((f) => ({ id: f.id, name: f.name }))}
        />
      )}
    </div>
  );
}
