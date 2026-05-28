"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import UploadForm from "@/components/upload/upload-form";
import { getMockPhotoDataUrl } from "@/lib/gallery/mock-data";

type PhotoItem = { id: string; name: string };
type FolderOption = { id: string; name: string };
type ActionTarget = "file" | "folder" | null;

type FolderPhotoManagerProps = {
  photos: PhotoItem[];
  roomId: string;
  currentFolderId: string;
  roomRootFolderId: string;
  moveTargets: FolderOption[];
  childFolders: FolderOption[];
  isMock?: boolean;
};

function getPhotoVariant(index: number) {
  const pattern = index % 6;
  if (pattern === 0) return "editorial-photo-card editorial-photo-card--tall editorial-photo-card--tilt-left";
  if (pattern === 1) return "editorial-photo-card editorial-photo-card--tilt-right";
  if (pattern === 2) return "editorial-photo-card editorial-photo-card--raised";
  if (pattern === 3) return "editorial-photo-card editorial-photo-card--soft";
  if (pattern === 4) return "editorial-photo-card editorial-photo-card--tall editorial-photo-card--tilt-right";
  return "editorial-photo-card editorial-photo-card--tilt-left";
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path
        d="m7 16 3.2-3.2a1 1 0 0 1 1.4 0L14 15l1.2-1.2a1 1 0 0 1 1.4 0L19 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6H10l2 2h5.5A2.5 2.5 0 0 1 20 10.5v6A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7h10m0 0-2.5-2.5M17 7l-2.5 2.5M17 17H7m0 0 2.5-2.5M7 17l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14m-9-2h4m-7 2 1 11a2 2 0 0 0 2 1.8h4a2 2 0 0 0 2-1.8L17 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ up = false }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={up ? "m6 14 6-6 6 6" : "m6 10 6 6 6-6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6.5 12.5 3.5 3.5 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FolderPhotoManager({
  photos,
  roomId,
  currentFolderId,
  roomRootFolderId,
  moveTargets,
  childFolders,
  isMock = false,
}: FolderPhotoManagerProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<ActionTarget>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showMovePopup, setShowMovePopup] = useState(false);
  const [showFolderCreatePopup, setShowFolderCreatePopup] = useState(false);
  const [showFolderMovePopup, setShowFolderMovePopup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hiddenPhotoIds, setHiddenPhotoIds] = useState<string[]>([]);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [folderRailCollapsed, setFolderRailCollapsed] = useState(childFolders.length === 0);

  const visiblePhotos = photos.filter((photo) => !hiddenPhotoIds.includes(photo.id));
  const moveFolderTargets = moveTargets.filter((folder) => folder.id !== currentFolderId);
  const effectiveTargetFolderId =
    targetFolderId && moveFolderTargets.some((folder) => folder.id === targetFolderId)
      ? targetFolderId
      : moveFolderTargets[0]?.id ?? "";
  const currentPhoto = activeIndex !== null ? visiblePhotos[activeIndex] : null;
  const fileSelectionMode = target === "file";
  const railOffset = folderRailCollapsed ? "5.3rem" : "calc(var(--bottom-sheet-h) + 1.85rem)";
  const contentPaddingBottom = folderRailCollapsed ? "9rem" : "calc(var(--bottom-sheet-h) + 6.1rem)";

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? current : current === 0 ? visiblePhotos.length - 1 : current - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? current : current === visiblePhotos.length - 1 ? 0 : current + 1,
        );
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, visiblePhotos.length]);

  useEffect(() => {
    const isIdle =
      !showUploadPopup &&
      !showMovePopup &&
      !showFolderCreatePopup &&
      !showFolderMovePopup &&
      !busy &&
      activeIndex === null;

    if (!isIdle || isMock) return;
    const timer = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [
    activeIndex,
    busy,
    isMock,
    router,
    showFolderCreatePopup,
    showFolderMovePopup,
    showMovePopup,
    showUploadPopup,
  ]);

  function photoSrc(photo: PhotoItem, index: number) {
    return isMock ? getMockPhotoDataUrl(photo.name, index + 20) : `/api/drive/file/${photo.id}`;
  }

  function onPhotoTap(index: number, photoId: string) {
    if (fileSelectionMode) {
      setSelectedIds((current) =>
        current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId],
      );
      return;
    }
    setActiveIndex(index);
  }

  async function deleteSelectedFiles() {
    if (selectedIds.length === 0 || busy || isMock) return;
    if (!confirm(`선택한 사진 ${selectedIds.length}장을 삭제할까요?`)) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedIds }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "사진을 삭제할 수 없습니다.");
        return;
      }
      setSelectedIds([]);
      router.refresh();
    } catch {
      setError("네트워크 오류로 사진 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function moveSelectedFiles() {
    if (selectedIds.length === 0 || !effectiveTargetFolderId || busy || isMock) return;

    setBusy(true);
    setError("");
    try {
      for (const fileId of selectedIds) {
        const response = await fetch("/api/drive/file/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            fromFolderId: currentFolderId,
            toFolderId: effectiveTargetFolderId,
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "사진을 이동할 수 없습니다.");
          return;
        }
      }
      setSelectedIds([]);
      setShowMovePopup(false);
      router.refresh();
    } catch {
      setError("네트워크 오류로 사진 이동에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function createSubFolder() {
    if (!newFolderName.trim() || busy || isMock) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentFolderId: currentFolderId, folderName: newFolderName.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "폴더를 만들 수 없습니다.");
        return;
      }
      setNewFolderName("");
      setShowFolderCreatePopup(false);
      router.refresh();
    } catch {
      setError("네트워크 오류로 폴더 생성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function moveCurrentFolder() {
    if (!effectiveTargetFolderId || moveFolderTargets.length === 0 || busy || isMock) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/file/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: currentFolderId,
          fromFolderId: roomRootFolderId,
          toFolderId: effectiveTargetFolderId,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "폴더를 이동할 수 없습니다.");
        return;
      }
      setShowFolderMovePopup(false);
      router.push(`/${roomId}`);
      router.refresh();
    } catch {
      setError("네트워크 오류로 폴더 이동에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCurrentFolder() {
    if (busy || isMock || photos.length > 0) return;
    if (!confirm("이 폴더를 삭제할까요?")) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [currentFolderId] }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "폴더를 삭제할 수 없습니다.");
        return;
      }
      router.push(`/${roomId}`);
      router.refresh();
    } catch {
      setError("네트워크 오류로 폴더 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function renderSubdock(kind: "file" | "folder") {
    if (kind === "file") {
      return (
        <div className="action-subdock" data-testid="file-subdock">
          <button type="button" onClick={() => setShowUploadPopup(true)} className="action-orb subtle" data-testid="file-add-button" aria-label="Add photo">
            <AddIcon />
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0 || moveFolderTargets.length === 0 || busy || isMock}
            onClick={() => setShowMovePopup(true)}
            className="action-orb subtle"
            data-testid="file-move-button"
            aria-label="Move selected photos"
          >
            <MoveIcon />
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0 || busy || isMock}
            onClick={deleteSelectedFiles}
            className="action-orb danger"
            data-testid="file-delete-button"
            aria-label="Delete selected photos"
          >
            <TrashIcon />
          </button>
        </div>
      );
    }

    return (
      <div className="action-subdock" data-testid="folder-subdock">
        <button type="button" onClick={() => setShowFolderCreatePopup(true)} className="action-orb folder-subtle" data-testid="folder-add-button" aria-label="Add folder">
          <AddIcon />
        </button>
        <button
          type="button"
          disabled={moveFolderTargets.length === 0 || busy || isMock}
          onClick={() => setShowFolderMovePopup(true)}
          className="action-orb folder-subtle"
          data-testid="folder-move-button"
          aria-label="Move this folder"
        >
          <MoveIcon />
        </button>
        <button
          type="button"
          disabled={busy || isMock || photos.length > 0}
          onClick={deleteCurrentFolder}
          className="action-orb danger"
          data-testid="folder-delete-button"
          aria-label="Delete this folder"
        >
          <TrashIcon />
        </button>
      </div>
    );
  }

  return (
    <>
      <main className="app-shell" style={{ paddingBottom: contentPaddingBottom }}>
        {target ? (
          <section className="mb-4 flex justify-center">
            <div className="selection-hint">
              {fileSelectionMode ? <PhotoIcon /> : <FolderIcon />}
              <span>{fileSelectionMode ? selectedIds.length : 1}</span>
            </div>
          </section>
        ) : null}

        {visiblePhotos.length === 0 ? (
          <section className="editorial-hero flex items-center justify-center">
            <div className="selection-hint">
              <PhotoIcon />
              <span>0</span>
            </div>
          </section>
        ) : (
          <section className="editorial-gallery">
            {visiblePhotos.map((photo, index) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <article
                  key={photo.id}
                  className={`${getPhotoVariant(index)}${isSelected ? " ring-2 ring-[color:var(--accent)] ring-offset-2 ring-offset-[color:var(--background)]" : ""}`}
                  onClick={() => onPhotoTap(index, photo.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={photo.name}
                  onKeyDown={(event) => event.key === "Enter" && onPhotoTap(index, photo.id)}
                >
                  <Image
                    src={photoSrc(photo, index)}
                    alt={photo.name}
                    fill
                    unoptimized={isMock}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    onError={() =>
                      setHiddenPhotoIds((current) =>
                        current.includes(photo.id) ? current : [...current, photo.id],
                      )
                    }
                  />
                  {isSelected ? (
                    <span className="check-badge" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : null}
                  <div className="editorial-photo-meta">
                    <p className="editorial-photo-index">{String(index + 1).padStart(2, "0")}</p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {error ? (
        <div className="fixed left-1/2 top-[calc(var(--header-h)+1rem)] z-[90] w-[min(calc(100%-1.5rem),32rem)] -translate-x-1/2 rounded-[1rem] border border-[#efc6be] bg-[color:var(--danger-light)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="action-dock" style={{ bottom: railOffset }} data-testid="folder-page-action-dock">
        <div className="action-main-stack">
          {target === "file" ? renderSubdock("file") : null}
          <button
            type="button"
            onClick={() => {
              setTarget((current) => (current === "file" ? null : "file"));
              setSelectedIds([]);
            }}
            className={`action-orb action-orb-main file-mode ${target === "file" ? "is-open" : ""}`}
            data-testid="file-main-button"
            aria-label="Photo actions"
          >
            <PhotoIcon />
            {selectedIds.length > 0 ? <span className="orb-dot">{selectedIds.length}</span> : null}
          </button>
          {target === "folder" ? renderSubdock("folder") : null}
          <button
            type="button"
            onClick={() => setTarget((current) => (current === "folder" ? null : "folder"))}
            className={`action-orb action-orb-main folder-mode ${target === "folder" ? "is-open" : ""}`}
            data-testid="folder-main-button"
            aria-label="Folder actions"
          >
            <FolderIcon />
          </button>
        </div>
      </div>

      <section className={`folder-rail${folderRailCollapsed ? " is-collapsed" : ""}${childFolders.length === 0 ? " is-empty" : ""}`}>
        <div className="folder-rail-inner">
          <div className="folder-rail-top">
            <button
              type="button"
              className="folder-rail-handle"
              onClick={() => setFolderRailCollapsed((current) => !current)}
              aria-label={folderRailCollapsed ? "Show folders" : "Hide folders"}
            >
              <ChevronIcon up={folderRailCollapsed} />
            </button>
          </div>
          {childFolders.length === 0 ? (
            <div className="folder-rail-empty">
              <FolderIcon />
            </div>
          ) : (
            <div className="folder-chip-row">
              {childFolders.map((folder) => (
                <Link key={folder.id} href={`/${roomId}/folder/${folder.id}${isMock ? "?mock=1" : ""}`} className="folder-chip">
                  <span className="folder-chip-icon" aria-hidden="true">
                    <FolderIcon />
                  </span>
                  <span className="folder-chip-name" data-testid={`folder-chip-${folder.id}`}>{folder.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {showUploadPopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowUploadPopup(false)}>
              <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Upload</p>
                    <h2 className="font-serif text-xl text-[color:var(--foreground)]">Add Photos</h2>
                  </div>
                  <button type="button" onClick={() => setShowUploadPopup(false)} className="ghost-icon-button" aria-label="Close upload">
                    <CloseIcon />
                  </button>
                </div>
                <UploadForm folderId={currentFolderId} />
              </div>
            </div>,
            document.body,
          )
        : null}

      {showMovePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowMovePopup(false)}>
              <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">Move Photos</h2>
                <select value={effectiveTargetFolderId} onChange={(event) => setTargetFolderId(event.target.value)} className="input-base mt-4">
                  {moveFolderTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowMovePopup(false)} className="btn-ghost flex-1">Cancel</button>
                  <button type="button" disabled={!effectiveTargetFolderId || selectedIds.length === 0 || busy} onClick={moveSelectedFiles} className="btn-primary flex-1">Move</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showFolderCreatePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowFolderCreatePopup(false)}>
              <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">New Folder</h2>
                <input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Folder name" className="input-base mt-4" />
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFolderCreatePopup(false)} className="btn-ghost flex-1">Cancel</button>
                  <button type="button" disabled={!newFolderName.trim() || busy} onClick={createSubFolder} className="btn-primary flex-1">Create</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showFolderMovePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowFolderMovePopup(false)}>
              <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">Move Folder</h2>
                <select value={effectiveTargetFolderId} onChange={(event) => setTargetFolderId(event.target.value)} className="input-base mt-4">
                  {moveFolderTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFolderMovePopup(false)} className="btn-ghost flex-1">Cancel</button>
                  <button type="button" disabled={!effectiveTargetFolderId || moveFolderTargets.length === 0 || busy} onClick={moveCurrentFolder} className="btn-primary flex-1">Move</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {currentPhoto
        ? createPortal(
            <div className="viewer-overlay" onClick={() => setActiveIndex(null)}>
              <div className="viewer-shell" onClick={(event) => event.stopPropagation()}>
                <div className="viewer-topbar">
                  <div className="viewer-counter">{activeIndex !== null ? `${activeIndex + 1} / ${visiblePhotos.length}` : ""}</div>
                  <button type="button" onClick={() => setActiveIndex(null)} className="ghost-icon-button ghost-icon-button-dark" aria-label="Close viewer">
                    <CloseIcon />
                  </button>
                </div>
                <div className="viewer-stage">
                  <button type="button" onClick={() => setActiveIndex((current) => (current === null ? current : current === 0 ? visiblePhotos.length - 1 : current - 1))} className="viewer-nav viewer-nav-left" aria-label="Previous photo">
                    <PrevIcon />
                  </button>
                  <Image src={photoSrc(currentPhoto, activeIndex ?? 0)} alt={currentPhoto.name} fill unoptimized={isMock} sizes="100vw" className="viewer-image" />
                  <button type="button" onClick={() => setActiveIndex((current) => (current === null ? current : current === visiblePhotos.length - 1 ? 0 : current + 1))} className="viewer-nav viewer-nav-right" aria-label="Next photo">
                    <NextIcon />
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

