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
  if (index === 0) return "editorial-photo-card editorial-photo-card--feature";
  if (index % 4 === 0) return "editorial-photo-card editorial-photo-card--tall";
  return "editorial-photo-card";
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

  const visiblePhotos = photos.filter((photo) => !hiddenPhotoIds.includes(photo.id));
  const moveFolderTargets = moveTargets.filter((folder) => folder.id !== currentFolderId);
  const effectiveTargetFolderId =
    targetFolderId && moveFolderTargets.some((folder) => folder.id === targetFolderId)
      ? targetFolderId
      : moveFolderTargets[0]?.id ?? "";
  const currentPhoto = activeIndex !== null ? visiblePhotos[activeIndex] : null;
  const fileSelectionMode = target === "file";

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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
    if (!confirm(`${selectedIds.length}개 파일을 삭제할까요?`)) return;
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
        setError(data.error ?? "파일 삭제에 실패했습니다.");
        return;
      }
      setSelectedIds([]);
      router.refresh();
    } catch {
      setError("네트워크 오류로 파일 삭제에 실패했습니다.");
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
          setError(data.error ?? "파일 이동에 실패했습니다.");
          return;
        }
      }
      setSelectedIds([]);
      setShowMovePopup(false);
      router.refresh();
    } catch {
      setError("네트워크 오류로 파일 이동에 실패했습니다.");
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
        setError(data.error ?? "폴더 생성에 실패했습니다.");
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
    if (!effectiveTargetFolderId || busy || isMock) return;
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
        setError(data.error ?? "폴더 이동에 실패했습니다.");
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
    if (busy || isMock) return;
    if (photos.length > 0) {
      setError("사진이 있는 폴더는 삭제할 수 없습니다. 먼저 사진을 모두 이동하거나 삭제해 주세요.");
      return;
    }
    if (!confirm("현재 폴더를 삭제할까요?")) return;
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
        setError(data.error ?? "폴더 삭제에 실패했습니다.");
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

  return (
    <>
      <main className="app-shell">
        {target ? (
          <section className="mb-4 flex items-center justify-between rounded-[1rem] bg-[rgba(255,253,249,0.72)] px-4 py-3 text-sm text-[color:var(--foreground-secondary)]">
            <span>{fileSelectionMode ? "사진 선택" : "폴더 선택"}</span>
            <span>{fileSelectionMode ? selectedIds.length : 1}</span>
          </section>
        ) : null}

        {visiblePhotos.length === 0 ? (
          <section className="editorial-hero">
            <p className="text-sm text-[color:var(--foreground-secondary)]">이 폴더에는 아직 사진이 없습니다.</p>
          </section>
        ) : (
          <section className="editorial-gallery">
            {visiblePhotos.map((photo, index) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <article
                  key={photo.id}
                  className={`${getPhotoVariant(index)}${isSelected ? " ring-2 ring-[color:var(--primary)] ring-offset-2 ring-offset-[color:var(--background)]" : ""}`}
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
                  {isSelected ? <span className="check-badge" aria-hidden="true">✓</span> : null}
                  <div className="editorial-photo-meta">
                    <div>
                      <p className="editorial-photo-index">{String(index + 1).padStart(2, "0")}</p>
                    </div>
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

      <div className="action-dock" data-testid="folder-page-action-dock">
        {target === "file" ? (
          <div className="action-subdock" data-testid="file-subdock">
            <button type="button" onClick={() => setShowUploadPopup(true)} className="action-pill subtle" data-testid="file-add-button">
              추가
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || moveFolderTargets.length === 0 || busy || isMock}
              onClick={() => setShowMovePopup(true)}
              className="action-pill subtle disabled:opacity-40"
              data-testid="file-move-button"
            >
              이동
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || busy || isMock}
              onClick={deleteSelectedFiles}
              className="action-pill danger disabled:opacity-40"
              data-testid="file-delete-button"
            >
              삭제
            </button>
          </div>
        ) : null}
        {target === "folder" ? (
          <div className="action-subdock" data-testid="folder-subdock">
            <button type="button" onClick={() => setShowFolderCreatePopup(true)} className="action-pill subtle" data-testid="folder-add-button">
              추가
            </button>
            <button
              type="button"
              disabled={moveFolderTargets.length === 0 || busy || isMock}
              onClick={() => setShowFolderMovePopup(true)}
              className="action-pill subtle disabled:opacity-40"
              data-testid="folder-move-button"
            >
              이동
            </button>
            <button
              type="button"
              disabled={busy || isMock}
              onClick={deleteCurrentFolder}
              className="action-pill danger disabled:opacity-40"
              data-testid="folder-delete-button"
            >
              삭제
            </button>
          </div>
        ) : null}
        <div className="action-main-row">
        <button
          type="button"
          onClick={() => {
            setTarget((current) => (current === "file" ? null : "file"));
            setSelectedIds([]);
          }}
          className={`action-pill action-pill-main ${target === "file" ? "active" : ""}`}
          data-testid="file-main-button"
        >
          파일
        </button>
        <button
          type="button"
          onClick={() => setTarget((current) => (current === "folder" ? null : "folder"))}
          className={`action-pill action-pill-main ${target === "folder" ? "secondary-active" : "subtle"}`}
          data-testid="folder-main-button"
        >
          폴더
        </button>
        </div>
      </div>

      <section className="folder-rail">
        <div className="folder-rail-inner">
          {childFolders.length === 0 ? (
            <p className="text-sm text-[color:var(--foreground-secondary)]">하위 폴더 없음</p>
          ) : (
            <div className="folder-chip-row">
              {childFolders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/${roomId}/folder/${folder.id}${isMock ? "?mock=1" : ""}`}
                  className="folder-chip"
                >
                  <span className="font-serif text-lg leading-none" data-testid={`folder-chip-${folder.id}`}>{folder.name}</span>
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
                    <p className="eyebrow">Upload editor</p>
                    <h2 className="font-serif text-xl text-[color:var(--foreground)]">사진 추가</h2>
                  </div>
                  <button type="button" onClick={() => setShowUploadPopup(false)} className="ghost-icon-button" aria-label="닫기">
                    ×
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
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">사진 이동</h2>
                <p className="mt-2 text-sm text-[color:var(--foreground-secondary)]">{selectedIds.length}장을 다른 폴더로 옮깁니다.</p>
                <select value={effectiveTargetFolderId} onChange={(event) => setTargetFolderId(event.target.value)} className="input-base mt-4">
                  {moveFolderTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowMovePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!effectiveTargetFolderId || selectedIds.length === 0 || busy} onClick={moveSelectedFiles} className="btn-primary flex-1">이동하기</button>
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
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">하위 폴더 만들기</h2>
                <input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="예: 저녁 산책"
                  className="input-base mt-4"
                />
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFolderCreatePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!newFolderName.trim() || busy} onClick={createSubFolder} className="btn-primary flex-1">만들기</button>
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
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">폴더 이동</h2>
                <p className="mt-2 text-sm text-[color:var(--foreground-secondary)]">현재 폴더의 위치를 다시 정리합니다.</p>
                <select value={effectiveTargetFolderId} onChange={(event) => setTargetFolderId(event.target.value)} className="input-base mt-4">
                  {moveFolderTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFolderMovePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!effectiveTargetFolderId || busy} onClick={moveCurrentFolder} className="btn-primary flex-1">이동하기</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {currentPhoto
        ? createPortal(
            <div className="fixed inset-0 z-[9999] bg-[rgba(12,9,7,0.94)]" onClick={() => setActiveIndex(null)}>
              <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-5">
                <div className="mb-4 flex items-center justify-between text-white/80">
                  <div>
                    <p className="eyebrow text-[rgba(255,250,244,0.55)]">Viewer</p>
                    <h3 className="font-serif text-2xl text-white">{activeIndex !== null ? `${activeIndex + 1} / ${visiblePhotos.length}` : ""}</h3>
                  </div>
                  <button type="button" onClick={() => setActiveIndex(null)} className="ghost-icon-button border-white/20 bg-white/10 text-white" aria-label="닫기">
                    ×
                  </button>
                </div>
                <div className="relative flex flex-1 items-center justify-center" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((currentValue) =>
                        currentValue === null ? currentValue : currentValue === 0 ? visiblePhotos.length - 1 : currentValue - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-2xl text-white backdrop-blur"
                    aria-label="이전"
                  >
                    ‹
                  </button>
                  <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-white/10">
                    <Image
                      src={photoSrc(currentPhoto, activeIndex ?? 0)}
                      alt={currentPhoto.name}
                      fill
                      unoptimized={isMock}
                      sizes="100vw"
                      className="object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((currentValue) =>
                        currentValue === null ? currentValue : currentValue === visiblePhotos.length - 1 ? 0 : currentValue + 1,
                      )
                    }
                    className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-2xl text-white backdrop-blur"
                    aria-label="다음"
                  >
                    ›
                  </button>
                </div>
                <p className="mt-4 text-center text-sm text-white/62">
                  {activeIndex !== null ? `${activeIndex + 1} / ${visiblePhotos.length}` : ""}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
