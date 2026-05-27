"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import UploadForm from "@/components/upload/upload-form";

type PhotoItem = { id: string; name: string };
type FolderOption = { id: string; name: string };

type FolderPhotoManagerProps = {
  photos: PhotoItem[];
  roomId: string;
  currentFolderId: string;
  roomRootFolderId: string;
  moveTargets: FolderOption[];
  childFolders: FolderOption[];
};

type ActionTarget = "file" | "folder" | null;

export default function FolderPhotoManager({
  photos,
  roomId,
  currentFolderId,
  roomRootFolderId,
  moveTargets,
  childFolders,
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
  const [targetFolderId, setTargetFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const selectionMode = target === "file";
  const current = activeIndex !== null ? photos[activeIndex] : null;

  const moveFolderTargets = useMemo(
    () => moveTargets.filter((f) => f.id !== currentFolderId),
    [moveTargets, currentFolderId],
  );
  const effectiveTargetFolderId =
    targetFolderId && moveFolderTargets.some((f) => f.id === targetFolderId)
      ? targetFolderId
      : (moveFolderTargets[0]?.id ?? "");

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => {
    setActiveIndex((v) => (v === null ? v : v === 0 ? photos.length - 1 : v - 1));
  }, [photos.length]);
  const next = useCallback(() => {
    setActiveIndex((v) => (v === null ? v : v === photos.length - 1 ? 0 : v + 1));
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, closeLightbox, prev, next]);

  useEffect(() => {
    window.localStorage.setItem("folder-gallery-view-mode", "plain");
  }, []);

  useEffect(() => {
    const idle =
      !showUploadPopup && !showMovePopup && !showFolderCreatePopup && !showFolderMovePopup && !busy && activeIndex === null;
    if (!idle) return;
    const t = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(t);
  }, [activeIndex, busy, router, showFolderCreatePopup, showFolderMovePopup, showMovePopup, showUploadPopup]);

  function refreshView() {
    setTarget(null);
    setSelectedIds([]);
    setError("");
    router.refresh();
  }

  function onPhotoTap(index: number, photoId: string) {
    setError("");
    if (selectionMode) {
      setSelectedIds((prev) =>
        prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId],
      );
      return;
    }
    setActiveIndex(index);
  }

  async function deleteSelectedFiles() {
    if (selectedIds.length === 0 || busy) return;
    if (!confirm(`${selectedIds.length}개 파일을 삭제할까요?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/drive/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedIds }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "파일 삭제에 실패했습니다."); return; }
      setSelectedIds([]);
      router.refresh();
    } catch { setError("네트워크 오류로 파일 삭제에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function moveSelectedFiles() {
    if (selectedIds.length === 0 || !effectiveTargetFolderId || busy) return;
    setBusy(true);
    setError("");
    try {
      for (const fileId of selectedIds) {
        const res = await fetch("/api/drive/file/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, fromFolderId: currentFolderId, toFolderId: effectiveTargetFolderId }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) { setError(data.error ?? "파일 이동에 실패했습니다."); setBusy(false); return; }
      }
      setSelectedIds([]);
      setShowMovePopup(false);
      router.refresh();
    } catch { setError("네트워크 오류로 파일 이동에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function createSubFolder() {
    if (!newFolderName.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/drive/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentFolderId: currentFolderId, folderName: newFolderName.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "폴더 생성에 실패했습니다."); return; }
      setNewFolderName("");
      setShowFolderCreatePopup(false);
      router.refresh();
    } catch { setError("네트워크 오류로 폴더 생성에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function moveCurrentFolder() {
    if (!effectiveTargetFolderId || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/drive/file/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: currentFolderId, fromFolderId: roomRootFolderId, toFolderId: effectiveTargetFolderId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "폴더 이동에 실패했습니다."); return; }
      setShowFolderMovePopup(false);
      router.push(`/${roomId}`);
      router.refresh();
    } catch { setError("네트워크 오류로 폴더 이동에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function deleteCurrentFolder() {
    if (busy) return;
    if (photos.length > 0) {
      setError("사진이 있는 폴더는 삭제할 수 없습니다. 먼저 사진을 모두 이동/삭제해 주세요.");
      return;
    }
    if (!confirm("현재 폴더를 삭제할까요?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/drive/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [currentFolderId] }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "폴더 삭제에 실패했습니다."); return; }
      router.push(`/${roomId}`);
      router.refresh();
    } catch { setError("네트워크 오류로 폴더 삭제에 실패했습니다."); }
    finally { setBusy(false); }
  }

  const BOTTOM_H = childFolders.length > 0 ? "88px" : "44px";

  return (
    <>
      {/* ── Selection mode banner ── */}
      {(selectionMode || target === "folder") && (
        <div className="sticky top-[57px] z-[9990] bg-[color:var(--accent-light)] px-4 py-2 text-center text-xs font-semibold text-[color:var(--primary)]">
          {selectionMode
            ? `사진 선택 중 · ${selectedIds.length}개 선택됨`
            : "폴더 관리 모드"}
        </div>
      )}

      {/* ── Photo grid ── */}
      <main className="pb-[calc(var(--bottom-h,88px)+4rem)]">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-[color:var(--foreground-secondary)]">이 폴더에는 아직 사진이 없습니다.</p>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo, index) => {
              const selected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`photo-thumb${selected ? " selected" : ""}`}
                  onClick={() => onPhotoTap(index, photo.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={photo.name}
                  onKeyDown={(e) => e.key === "Enter" && onPhotoTap(index, photo.id)}
                >
                  <Image
                    src={`/api/drive/file/${photo.id}`}
                    alt={photo.name}
                    fill
                    sizes="(max-width: 480px) 33vw, (max-width: 768px) 33vw, 200px"
                    className="object-cover"
                  />
                  {selected && (
                    <span className="check-badge" aria-hidden="true">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Error ── */}
      {error ? (
        <div className="fixed bottom-[calc(var(--bottom-h,88px)+3.5rem)] left-0 right-0 z-[9991] mx-3 rounded-[calc(var(--radius)/2)] border border-[#f5c6c0] bg-[color:var(--danger-light)] px-3 py-2 text-xs text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      {/* ── Bottom sheet: child folders ── */}
      <div
        className="bottom-sheet"
        style={{ "--bottom-h": BOTTOM_H } as React.CSSProperties}
      >
        <div className="mx-auto w-full max-w-2xl px-3 py-2">
          {childFolders.length === 0 ? (
            <p className="py-2 text-center text-xs text-[color:var(--foreground-secondary)]">하위 폴더 없음</p>
          ) : (
            <div className="flex gap-1 overflow-x-auto">
              {childFolders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/${roomId}/folder/${folder.id}`}
                  className="folder-item min-w-[56px] flex-shrink-0"
                >
                  <div className="folder-icon" aria-hidden="true">
                    <span className="folder-icon-tab" />
                    <span className="folder-icon-body" />
                  </div>
                  <span className="w-14 truncate text-center text-[10px] font-medium text-[color:var(--foreground)]">
                    {folder.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FAB cluster ── */}
      <div
        className="fixed right-4 z-[9997] flex flex-col items-end gap-2"
        style={{ bottom: "calc(var(--bottom-h, 88px) + 1rem)" }}
      >
        {/* File sub-actions */}
        {target === "file" && (
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => setShowUploadPopup(true)}
              className="fab bg-[color:var(--foreground)] text-[color:var(--primary-fg)]" aria-label="사진 추가">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button type="button" disabled={selectedIds.length === 0 || moveFolderTargets.length === 0 || busy}
              onClick={() => setShowMovePopup(true)}
              className="fab border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] disabled:opacity-30" aria-label="이동">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                <path d="M3 8.5h11M10 5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button type="button" disabled={selectedIds.length === 0 || busy} onClick={deleteSelectedFiles}
              className="fab border border-[#f5c6c0] bg-[color:var(--danger-light)] text-[color:var(--danger)] disabled:opacity-30" aria-label="삭제">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Folder sub-actions */}
        {target === "folder" && (
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => setShowFolderCreatePopup(true)}
              className="fab bg-[color:var(--foreground)] text-[color:var(--primary-fg)]" aria-label="하위 폴더 추가">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button type="button" disabled={moveFolderTargets.length === 0 || busy} onClick={() => setShowFolderMovePopup(true)}
              className="fab border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] disabled:opacity-30" aria-label="폴더 이동">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                <path d="M3 8.5h11M10 5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button type="button" disabled={busy} onClick={deleteCurrentFolder}
              className="fab border border-[#f5c6c0] bg-[color:var(--danger-light)] text-[color:var(--danger)] disabled:opacity-30" aria-label="폴더 삭제">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Primary FABs */}
        <button type="button" onClick={() => { setTarget((v) => v === "file" ? null : "file"); setSelectedIds([]); }}
          className={`fab ${target === "file" ? "bg-[color:var(--primary)] text-[color:var(--primary-fg)]" : "bg-[color:var(--foreground)] text-[color:var(--primary-fg)]"}`}
          aria-label="파일 관리">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="3" y="2" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 8l4 4M15 8l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
        <button type="button" onClick={() => setTarget((v) => v === "folder" ? null : "folder")}
          className={`fab ${target === "folder" ? "bg-[color:var(--primary)] text-[color:var(--primary-fg)]" : "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]"}`}
          aria-label="폴더 관리">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 5a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
        <button type="button" onClick={refreshView}
          className="fab border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]"
          aria-label="새로고침">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
            <path d="M3 8.5a5.5 5.5 0 1110.5-2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M13.5 3v3.2H10.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Upload modal ── */}
      {showUploadPopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowUploadPopup(false)}>
              <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-base font-semibold text-[color:var(--foreground)]">사진 추가</h2>
                  <button type="button" onClick={() => setShowUploadPopup(false)} aria-label="닫기"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--foreground-secondary)] hover:bg-[color:var(--accent-light)]">
                    ×
                  </button>
                </div>
                <UploadForm folderId={currentFolderId} />
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ── File move modal ── */}
      {showMovePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowMovePopup(false)}>
              <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-serif text-base font-semibold text-[color:var(--foreground)]">사진 이동</h2>
                <p className="mt-1 text-xs text-[color:var(--foreground-secondary)]">{selectedIds.length}개 선택됨</p>
                <select value={effectiveTargetFolderId} onChange={(e) => setTargetFolderId(e.target.value)} className="input-base mt-3">
                  {moveFolderTargets.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowMovePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!effectiveTargetFolderId || selectedIds.length === 0 || busy} onClick={moveSelectedFiles} className="btn-primary flex-1">이동하기</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ── Folder create modal ── */}
      {showFolderCreatePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowFolderCreatePopup(false)}>
              <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-serif text-base font-semibold text-[color:var(--foreground)]">하위 폴더 만들기</h2>
                {error ? <p className="mt-2 text-xs text-[color:var(--danger)]">{error}</p> : null}
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="폴더 이름" className="input-base mt-3" />
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFolderCreatePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!newFolderName.trim() || busy} onClick={createSubFolder} className="btn-primary flex-1">만들기</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ── Folder move modal ── */}
      {showFolderMovePopup
        ? createPortal(
            <div className="modal-overlay" onClick={() => setShowFolderMovePopup(false)}>
              <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-serif text-base font-semibold text-[color:var(--foreground)]">폴더 이동</h2>
                <p className="mt-1 text-xs text-[color:var(--foreground-secondary)]">현재 폴더를 다른 폴더 아래로 이동합니다.</p>
                <select value={effectiveTargetFolderId} onChange={(e) => setTargetFolderId(e.target.value)} className="input-base mt-3">
                  {moveFolderTargets.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFolderMovePopup(false)} className="btn-ghost flex-1">취소</button>
                  <button type="button" disabled={!effectiveTargetFolderId || busy} onClick={moveCurrentFolder} className="btn-primary flex-1">이동하기</button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ── Lightbox ── */}
      {current
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black" onClick={closeLightbox}>
              <button type="button" onClick={closeLightbox} aria-label="닫기"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                ×
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="이전"
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm hover:bg-white/20">
                ‹
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="다음"
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-sm hover:bg-white/20">
                ›
              </button>
              <div className="relative flex h-full w-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                <Image
                  src={`/api/drive/file/${current.id}`}
                  alt={current.name}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/60">
                {activeIndex !== null ? `${activeIndex + 1} / ${photos.length}` : ""}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
