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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m15 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13 18.5h7m-3.5-3.5v7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CounterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 18h16M6.5 16V9.5m5 6.5V6.5M17.5 16v-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
          <div className="topbar-shell">
            <Link href={`/${roomId}?mock=1`} aria-label="Back to gallery" className="ghost-icon-button">
              <BackIcon />
            </Link>
            <div className="topbar-center">
              <div className="brand-mark">
                <GalleryIcon />
                <span>Collection</span>
              </div>
            </div>
            <div className="counter-pill" aria-label={`${MOCK_FOLDER_PHOTOS.length} photos`}>
              <CounterIcon />
              <span>{MOCK_FOLDER_PHOTOS.length}</span>
            </div>
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
    loadError = `Unable to load folder data: ${message}`;
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="topbar px-4">
        <div className="topbar-shell">
          <Link href={`/${roomId}`} aria-label="Back to gallery" className="ghost-icon-button">
            <BackIcon />
          </Link>
          <div className="topbar-center">
            <div className="brand-mark">
              <GalleryIcon />
              <span>Collection</span>
            </div>
          </div>
          <div className="counter-pill" aria-label={`${photos.length} photos`}>
            <CounterIcon />
            <span>{photos.length}</span>
          </div>
        </div>
      </header>

      <div style={{ height: "var(--header-h)" }} aria-hidden />

      {loadError ? (
        <div className="flex items-center justify-center p-6">
          <div className="card max-w-sm p-5 text-sm text-[color:var(--danger)]">{loadError}</div>
        </div>
      ) : (
        <FolderPhotoManager
          photos={photos.map((photo) => ({ id: photo.id, name: photo.name }))}
          roomId={roomId}
          currentFolderId={folderId}
          roomRootFolderId={roomRootFolderId}
          moveTargets={moveTargets.map((folder) => ({ id: folder.id, name: folder.name }))}
          childFolders={childFolders.map((folder) => ({ id: folder.id, name: folder.name }))}
        />
      )}
    </div>
  );
}
