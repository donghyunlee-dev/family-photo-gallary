"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import UploadForm from "@/components/upload/upload-form";
import { getMockPhotoDataUrl } from "@/lib/gallery/mock-data";

type PhotoItem = { id: string; name: string };
type FolderItem = { id: string; name: string };
type ActionTarget = "file" | "folder" | null;

type RoomDashboardManagerProps = {
  roomId: string;
  roomName: string;
  roomRootFolderId: string;
  photos: PhotoItem[];
  folders: FolderItem[];
  isMock?: boolean;
};

function getPhotoVariant(index: number) {
  if (index === 0) return "editorial-photo-card editorial-photo-card--feature";
  if (index % 5 === 0) return "editorial-photo-card editorial-photo-card--tall";
  return "editorial-photo-card";
}

export default function RoomDashboardManager({
  roomId,
  roomName,
  roomRootFolderId,
  photos,
  folders,
  isMock = false,
}: RoomDashboardManagerProps) {
  const router = useRouter();
  const [target, setTarget] = useState<ActionTarget>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showFileMovePopup, setShowFileMovePopup] = useState(false);
  const [showFolderCreatePopup, setShowFolderCreatePopup] = useState(false);
  const [showFolderMovePopup, setShowFolderMovePopup] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hiddenPhotoIds, setHiddenPhotoIds] = useState<string[]>([]);

  const photoSelectionMode = target === "file";
  const folderSelectionMode = target === "folder";
  const visiblePhotos = photos.filter((photo) => !hiddenPhotoIds.includes(photo.id));
  const moveTargets = folders.filter((folder) => !selectedFolderIds.includes(folder.id));
  const effectiveTargetFolderId =
    targetFolderId && moveTargets.some((folder) => folder.id === targetFolderId)
      ? targetFolderId
      : moveTargets[0]?.id ?? "";
  const currentPhoto = activePhotoIndex !== null ? visiblePhotos[activePhotoIndex] : null;

  useEffect(() => {
    if (activePhotoIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePhotoIndex(null);
      if (event.key === "ArrowLeft") {
        setActivePhotoIndex((current) =>
          current === null ? current : current === 0 ? visiblePhotos.length - 1 : current - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setActivePhotoIndex((current) =>
          current === null ? current : current === visiblePhotos.length - 1 ? 0 : current + 1,
        );
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePhotoIndex, visiblePhotos.length]);

  useEffect(() => {
    const isIdle =
      !showUploadPopup &&
      !showFileMovePopup &&
      !showFolderCreatePopup &&
      !showFolderMovePopup &&
      !busy &&
      activePhotoIndex === null;
    if (!isIdle || isMock) return;
    const timer = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [
    activePhotoIndex,
    busy,
    isMock,
    router,
    showFileMovePopup,
    showFolderCreatePopup,
    showFolderMovePopup,
    showUploadPopup,
  ]);

  function resetSelections() {
    setSelectedPhotoIds([]);
    setSelectedFolderIds([]);
    setError("");
  }

  function toggleTarget(next: ActionTarget) {
    setTarget((current) => (current === next ? null : next));
    resetSelections();
  }

  function photoSrc(photo: PhotoItem, index: number) {
    return isMock ? getMockPhotoDataUrl(photo.name, index) : `/api/drive/file/${photo.id}`;
  }

  function onPhotoTap(index: number, photoId: string) {
    setError("");
    if (photoSelectionMode) {
      setSelectedPhotoIds((current) =>
        current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId],
      );
      return;
    }
    setActivePhotoIndex(index);
  }

  function onFolderTap(folderId: string) {
    if (!folderSelectionMode) return;
    setSelectedFolderIds((current) =>
      current.includes(folderId) ? current.filter((id) => id !== folderId) : [...current, folderId],
    );
  }

  async function deleteFiles() {
    if (selectedPhotoIds.length === 0 || busy || isMock) return;
    if (!confirm(`${selectedPhotoIds.length}개 파일을 삭제할까요?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedPhotoIds }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "파일 삭제에 실패했습니다.");
        return;
      }
      resetSelections();
      router.refresh();
    } catch {
      setError("네트워크 오류로 파일 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function moveFiles() {
    if (selectedPhotoIds.length === 0 || !effectiveTargetFolderId || busy || isMock) return;
    setBusy(true);
    setError("");
    try {
      for (const fileId of selectedPhotoIds) {
        const response = await fetch("/api/drive/file/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId,
            fromFolderId: roomRootFolderId,
            toFolderId: effectiveTargetFolderId,
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "파일 이동에 실패했습니다.");
          return;
        }
      }
      setShowFileMovePopup(false);
      resetSelections();
      router.refresh();
    } catch {
      setError("네트워크 오류로 파일 이동에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim() || busy || isMock) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentFolderId: roomRootFolderId, folderName: newFolderName.trim() }),
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

  async function moveFolders() {
    if (selectedFolderIds.length === 0 || !effectiveTargetFolderId || busy || isMock) return;
    setBusy(true);
    setError("");
    try {
      for (const folderId of selectedFolderIds) {
        const response = await fetch("/api/drive/file/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: folderId,
            fromFolderId: roomRootFolderId,
            toFolderId: effectiveTargetFolderId,
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "폴더 이동에 실패했습니다.");
          return;
        }
      }
      setShowFolderMovePopup(false);
      resetSelections();
      router.refresh();
    } catch {
      setError("네트워크 오류로 폴더 이동에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFolders() {
    if (selectedFolderIds.length === 0 || busy || isMock) return;
    if (!confirm(`${selectedFolderIds.length}개 폴더를 삭제할까요?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/drive/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedFolderIds }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "폴더 삭제에 실패했습니다.");
        return;
      }
      resetSelections();
      router.refresh();
    } catch {
      setError("네트워크 오류로 폴더 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar px-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
              {roomName}
            </h1>
            <p className="text-sm text-[color:var(--foreground-secondary)]">
              사진 {visiblePhotos.length}장 · 폴더 {folders.length}개
            </p>
          </div>
          <Link href="/" aria-label="나가기" className="ghost-icon-button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </header>

      <div style={{ height: "var(--header-h)" }} aria-hidden />

      <main className="app-shell">
        {(photoSelectionMode || folderSelectionMode) ? (
          <section className="mb-4 flex items-center justify-between rounded-[1rem] bg-[rgba(255,253,249,0.72)] px-4 py-3 text-sm text-[color:var(--foreground-secondary)]">
            <span>{photoSelectionMode ? "사진 선택" : "폴더 선택"}</span>
            <span>{photoSelectionMode ? selectedPhotoIds.length : selectedFolderIds.length}</span>
          </section>
        ) : null}

        {visiblePhotos.length === 0 ? (
          <section className="editorial-hero">
            <p className="text-sm text-[color:var(--foreground-secondary)]">아직 업로드된 사진이 없습니다.</p>
          </section>
        ) : (
          <section className="editorial-gallery">
            {visiblePhotos.map((photo, index) => {
              const isSelected = selectedPhotoIds.includes(photo.id);
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

      <div className="action-dock" data-testid="room-action-dock">
        {target === "file" ? (
          <div className="action-subdock" data-testid="file-subdock">
            <button type="button" onClick={() => setShowUploadPopup(true)} className="action-pill subtle" data-testid="file-add-button">
              추가
            </button>
            <button
              type="button"
              disabled={selectedPhotoIds.length === 0 || moveTargets.length === 0 || busy || isMock}
              onClick={() => setShowFileMovePopup(true)}
              className="action-pill subtle disabled:opacity-40"
              data-testid="file-move-button"
            >
              이동
            </button>
            <button
              type="button"
              disabled={selectedPhotoIds.length === 0 || busy || isMock}
              onClick={deleteFiles}
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
              disabled={selectedFolderIds.length === 0 || moveTargets.length === 0 || busy || isMock}
              onClick={() => setShowFolderMovePopup(true)}
              className="action-pill subtle disabled:opacity-40"
              data-testid="folder-move-button"
            >
              이동
            </button>
            <button
              type="button"
              disabled={selectedFolderIds.length === 0 || busy || isMock}
              onClick={deleteFolders}
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
          onClick={() => toggleTarget("file")}
          className={`action-pill action-pill-main ${target === "file" ? "active" : ""}`}
          data-testid="file-main-button"
        >
          파일
        </button>
        <button
          type="button"
          onClick={() => toggleTarget("folder")}
          className={`action-pill action-pill-main ${target === "folder" ? "secondary-active" : "subtle"}`}
          data-testid="folder-main-button"
        >
          폴더
        </button>
        </div>
      </div>

      <section className="folder-rail">
        <div className="folder-rail-inner">
          {folders.length === 0 ? (
            <p className="text-sm text-[color:var(--foreground-secondary)]">폴더 없음</p>
          ) : (
            <div className="folder-chip-row">
              {folders.map((folder) => {
                const isSelected = selectedFolderIds.includes(folder.id);
                return (
                  <Link
                    key={folder.id}
                    href={`/${roomId}/folder/${folder.id}${isMock ? "?mock=1" : ""}`}
                    onClick={(event) => {
                      if (!folderSelectionMode) return;
                      event.preventDefault();
                      onFolderTap(folder.id);
                    }}
                    className={`folder-chip${isSelected ? " selected" : ""}`}
                    data-testid={`folder-chip-${folder.id}`}
                  >
                    <span className="font-serif text-lg leading-none">{folder.name}</span>
                  </Link>
                );
              })}
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
                    <h2 className="font-serif text-xl text-[color:var(--foreground)]">새 사진 추가</h2>
                  </div>
                  <button type="button" onClick={() => setShowUploadPopup(false)} className="ghost-icon-button" aria-label="닫기">
                    ×
                  </button>
                </div>
                <UploadForm folderId={roomRootFolderId} />
              </div>
            </div>,
            document.body,
          )
        : null}

      {showFileMovePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowFileMovePopup(false)}>
              <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">사진 이동</h2>
                <p className="mt-2 text-sm text-[color:var(--foreground-secondary)]">{selectedPhotoIds.length}장을 다른 폴더로 옮깁니다.</p>
                <select value={effectiveTargetFolderId} onChange={(event) => setTargetFolderId(event.target.value)} className="input-base mt-4">
                  {moveTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFileMovePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!effectiveTargetFolderId || selectedPhotoIds.length === 0 || busy} onClick={moveFiles} className="btn-primary flex-1">이동하기</button>
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
                <h2 className="font-serif text-xl text-[color:var(--foreground)]">폴더 만들기</h2>
                <input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="예: 2026 봄 피크닉"
                  className="input-base mt-4"
                />
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFolderCreatePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!newFolderName.trim() || busy} onClick={createFolder} className="btn-primary flex-1">만들기</button>
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
                <p className="mt-2 text-sm text-[color:var(--foreground-secondary)]">{selectedFolderIds.length}개 폴더를 다른 위치로 정리합니다.</p>
                <select value={effectiveTargetFolderId} onChange={(event) => setTargetFolderId(event.target.value)} className="input-base mt-4">
                  {moveTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setShowFolderMovePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!effectiveTargetFolderId || selectedFolderIds.length === 0 || busy} onClick={moveFolders} className="btn-primary flex-1">이동하기</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {currentPhoto
        ? createPortal(
            <div className="fixed inset-0 z-[9999] bg-[rgba(12,9,7,0.94)]" onClick={() => setActivePhotoIndex(null)}>
              <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-5">
                <div className="mb-4 flex items-center justify-between text-white/80">
                  <div>
                    <p className="eyebrow text-[rgba(255,250,244,0.55)]">Viewer</p>
                    <h3 className="font-serif text-2xl text-white">{activePhotoIndex !== null ? `${activePhotoIndex + 1} / ${visiblePhotos.length}` : ""}</h3>
                  </div>
                  <button type="button" onClick={() => setActivePhotoIndex(null)} className="ghost-icon-button border-white/20 bg-white/10 text-white" aria-label="닫기">
                    ×
                  </button>
                </div>
                <div className="relative flex flex-1 items-center justify-center" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((current) =>
                        current === null ? current : current === 0 ? visiblePhotos.length - 1 : current - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-2xl text-white backdrop-blur"
                    aria-label="이전"
                  >
                    ‹
                  </button>
                  <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-white/10">
                    <Image
                      src={photoSrc(currentPhoto, activePhotoIndex ?? 0)}
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
                      setActivePhotoIndex((current) =>
                        current === null ? current : current === visiblePhotos.length - 1 ? 0 : current + 1,
                      )
                    }
                    className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-2xl text-white backdrop-blur"
                    aria-label="다음"
                  >
                    ›
                  </button>
                </div>
                <p className="mt-4 text-center text-sm text-white/62">
                  {activePhotoIndex !== null ? `${activePhotoIndex + 1} / ${visiblePhotos.length}` : ""}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
