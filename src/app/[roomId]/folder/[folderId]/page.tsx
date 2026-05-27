import Link from "next/link";
import { notFound } from "next/navigation";

import FolderPhotoManager from "@/components/gallery/folder-photo-manager";
import { MOCK_CHILD_FOLDERS, MOCK_FOLDER_PHOTOS, MOCK_ROOM_FOLDERS } from "@/lib/gallery/mock-data";
import { listFoldersFromFolder, listRecentPhotosFromFolder } from "@/lib/drive/service";
import { getRoomById, isRoomKey } from "@/lib/room/config";

export const dynamic = "force-dynamic";

type FolderPageProps = {
  params: Promise<{ roomId: string; folderId: string }>;
  searchParams: Promise<{ mock?: string }>;
};

export default async function FolderPage({ params, searchParams }: FolderPageProps) {
  const { roomId, folderId } = await params;
  const { mock } = await searchParams;
  const useMock = mock === "1";
  if (!isRoomKey(roomId)) notFound();
  if (!folderId) notFound();

  const room = getRoomById(roomId);
  if (!room) notFound();
  const roomRootFolderId = process.env[room.envFolderKey];
  if (useMock) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="topbar px-4">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-lg font-semibold text-[color:var(--foreground)] leading-tight">
                안동
              </h1>
              <p className="text-[11px] text-[color:var(--foreground-secondary)]">사진 {MOCK_FOLDER_PHOTOS.length}장</p>
            </div>
            <Link
              href={`/${roomId}?mock=1`}
              aria-label="뒤로 가기"
              className="ghost-icon-button"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </header>
        <div style={{ height: "var(--header-h)" }} aria-hidden />
        <FolderPhotoManager
          photos={MOCK_FOLDER_PHOTOS}
          roomId={roomId}
          currentFolderId={folderId}
          roomRootFolderId="mock-room-root"
          moveTargets={MOCK_ROOM_FOLDERS}
          childFolders={MOCK_CHILD_FOLDERS}
          isMock
        />
      </div>
    );
  }
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
      <header className="topbar px-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[color:var(--foreground)] leading-tight">
              {currentFolderName}
            </h1>
            <p className="text-sm text-[color:var(--foreground-secondary)]">
              사진 {photos.length}장
            </p>
          </div>
          <Link
            href={`/${roomId}`}
            aria-label="뒤로 가기"
            className="ghost-icon-button"
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
