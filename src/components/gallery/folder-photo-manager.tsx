"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import UploadForm from "@/components/upload/upload-form";

type PhotoItem = {
  id: string;
  name: string;
};

type FolderOption = {
  id: string;
  name: string;
};

type FolderPhotoManagerProps = {
  photos: PhotoItem[];
  roomId: string;
  currentFolderId: string;
  currentFolderName: string;
  roomRootFolderId: string;
  moveTargets: FolderOption[];
  childFolders: FolderOption[];
};

type ActionTarget = "file" | "folder" | null;
type GalleryViewMode = "plain" | "polaroid" | "photobook" | "wall" | "filmstrip" | "magazine";

export default function FolderPhotoManager({
  photos,
  roomId,
  currentFolderId,
  currentFolderName,
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
  const [viewMode, setViewMode] = useState<GalleryViewMode>(() => {
    if (typeof window === "undefined") return "polaroid";
    const savedMode = window.localStorage.getItem("folder-gallery-view-mode");
    if (savedMode && ["plain", "polaroid", "photobook", "wall", "filmstrip", "magazine"].includes(savedMode)) {
      return savedMode as GalleryViewMode;
    }
    return "plain";
  });

  const selectionMode = target === "file";
  const current = activeIndex !== null ? photos[activeIndex] : null;
  const viewModes: Array<{ key: GalleryViewMode; label: string; icon: string }> = [
    { key: "plain", label: "기본", icon: "☷" },
    { key: "polaroid", label: "폴라로이드", icon: "▣" },
    { key: "photobook", label: "포토북", icon: "▤" },
    { key: "wall", label: "벽사진", icon: "◫" },
    { key: "filmstrip", label: "필름스트립", icon: "☰" },
    { key: "magazine", label: "콜라주", icon: "◧" },
  ];

  const moveFolderTargets = useMemo(
    () => moveTargets.filter((folder) => folder.id !== currentFolderId),
    [moveTargets, currentFolderId],
  );
  const effectiveTargetFolderId =
    targetFolderId && moveFolderTargets.some((folder) => folder.id === targetFolderId)
      ? targetFolderId
      : (moveFolderTargets[0]?.id ?? "");

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => {
    setActiveIndex((value) => (value === null ? value : value === 0 ? photos.length - 1 : value - 1));
  }, [photos.length]);
  const next = useCallback(() => {
    setActiveIndex((value) => (value === null ? value : value === photos.length - 1 ? 0 : value + 1));
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, closeLightbox, prev, next]);

  useEffect(() => {
    window.localStorage.setItem("folder-gallery-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const shouldAutoRefresh =
      !showUploadPopup &&
      !showMovePopup &&
      !showFolderCreatePopup &&
      !showFolderMovePopup &&
      !busy &&
      activeIndex === null;

    if (!shouldAutoRefresh) return;
    const timer = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [
    activeIndex,
    busy,
    router,
    showFolderCreatePopup,
    showFolderMovePopup,
    showMovePopup,
    showUploadPopup,
  ]);

  function refreshView() {
    setTarget(null);
    setSelectedIds([]);
    setError("");
    router.refresh();
  }

  function onPhotoTap(index: number, photoId: string) {
    setError("");
    if (selectionMode) {
      setSelectedIds((prevIds) =>
        prevIds.includes(photoId) ? prevIds.filter((id) => id !== photoId) : [...prevIds, photoId],
      );
      return;
    }
    setActiveIndex(index);
  }

  function renderPhotoCard(photo: PhotoItem, index: number, className: string, imageClassName = "aspect-[4/3]") {
    const selected = selectedIds.includes(photo.id);
    return (
      <article
        key={photo.id}
        onClick={() => onPhotoTap(index, photo.id)}
        className={`w-full cursor-pointer overflow-hidden border bg-white ${className} ${
          selected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-stone-200"
        }`}
      >
        <div className={imageClassName}>
          <Image
            src={`/api/drive/file/${photo.id}`}
            alt={photo.name}
            width={480}
            height={360}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 240px"
            className="h-full w-full object-cover"
          />
        </div>
      </article>
    );
  }

  function renderGalleryByView() {
    if (viewMode === "filmstrip") {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="rounded-2xl border border-stone-300 bg-stone-900 p-2">
              <div className="mb-2 flex items-center justify-between px-1 text-stone-300">
                <span className="text-[10px] tracking-[0.35em]">•••••</span>
                <span className="text-[10px] tracking-[0.35em]">•••••</span>
              </div>
              <div className="h-44">
                {renderPhotoCard(photo, index, "rounded-lg border-stone-700", "aspect-[4/3]")}
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-stone-300">
                <span className="text-[10px] tracking-[0.35em]">•••••</span>
                <span className="text-[10px] tracking-[0.35em]">•••••</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "wall") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className={index % 2 === 0 ? "translate-y-1" : ""}>
              {renderPhotoCard(photo, index, "rounded-sm border-[6px] border-white shadow-md", "aspect-[4/5]")}
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "magazine") {
      return (
        <div className="grid auto-rows-[110px] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => {
            const big = index % 7 === 0 || index % 7 === 3;
            return (
              <div key={photo.id} className={big ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}>
                {renderPhotoCard(photo, index, "rounded-xl", "h-full")}
              </div>
            );
          })}
        </div>
      );
    }

    if (viewMode === "photobook") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <div key={photo.id} className="rounded-3xl bg-stone-50 p-3 shadow-inner">
              {renderPhotoCard(photo, index, "rounded-2xl", "aspect-[4/3]")}
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "plain") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.id}>
              {renderPhotoCard(photo, index, "rounded-lg", "aspect-[4/3]")}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 overflow-x-hidden sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className={index % 2 === 0 ? "pt-2" : ""}>
            {renderPhotoCard(photo, index, `rounded-md ${index % 2 === 0 ? "-rotate-[1deg]" : "rotate-[1deg]"}`, "aspect-[4/3]")}
          </div>
        ))}
      </div>
    );
  }

  async function deleteSelectedFiles() {
    if (selectedIds.length === 0 || busy) return;
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
    if (selectedIds.length === 0 || !effectiveTargetFolderId || busy) return;
    setBusy(true);
    setError("");
    try {
      for (const fileId of selectedIds) {
        const response = await fetch("/api/drive/file/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, fromFolderId: currentFolderId, toFolderId: effectiveTargetFolderId }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "파일 이동에 실패했습니다.");
          setBusy(false);
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
    if (!newFolderName.trim() || busy) return;
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
    if (!effectiveTargetFolderId || busy) return;
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
    if (busy) return;
    if (photos.length > 0) {
      setError("사진이 있는 폴더는 삭제할 수 없습니다. 먼저 사진을 모두 이동/삭제해 주세요.");
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
      <div className="mb-3 pt-1 text-xs text-stone-600">
        {selectionMode ? `파일 선택 모드 · ${selectedIds.length}개 선택` : "사진을 누르면 크게 볼 수 있습니다."}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {viewModes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            title={mode.label}
            aria-label={mode.label}
            onClick={() => setViewMode(mode.key)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
              viewMode === mode.key
                ? "border-stone-700 bg-stone-700 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            {mode.icon}
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-sm text-stone-600 shadow-sm">
          이 폴더에는 아직 사진이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-clip pb-32">{renderGalleryByView()}</div>
      )}

      <section className="fixed inset-x-0 bottom-0 z-[9992] border-t border-stone-200 bg-white px-4 pb-2 pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full max-w-5xl">
          {childFolders.length === 0 ? (
            <p className="mt-2 text-xs text-stone-600">현재 폴더 안에 하위 폴더가 없습니다.</p>
          ) : (
            <ul className="mt-1 grid max-h-56 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
              {childFolders.map((folder) => (
                <li key={folder.id} className="flex justify-center">
                  <Link href={`/${roomId}/folder/${folder.id}`} className="flex w-full flex-col items-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 shadow-sm">
                      <span className="absolute left-2 top-2 h-2.5 w-5 rounded-t-md bg-slate-300" />
                      <span className="mt-1 h-7 w-10 rounded-md bg-slate-400" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-center text-[11px] font-medium text-stone-800">{folder.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div
        className="fixed right-4 z-[9997]"
        style={{ bottom: "max(10rem, calc(env(safe-area-inset-bottom) + 9.5rem))" }}
      >
        <div className="relative flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setTarget((prev) => (prev === "file" ? null : "file"));
              setSelectedIds([]);
            }}
            className={`h-16 w-16 rounded-full text-sm font-semibold text-white shadow-lg ${
              target === "file" ? "bg-sky-200 text-sky-900" : "bg-stone-700 text-white"
            }`}
          >
            파일
          </button>
          <button
            type="button"
            onClick={() => setTarget((v) => (v === "folder" ? null : "folder"))}
            className={`h-16 w-16 rounded-full text-sm font-semibold text-white shadow-lg ${
              target === "folder" ? "bg-emerald-200 text-emerald-900" : "bg-stone-700 text-white"
            }`}
          >
            폴더
          </button>
          <button
            type="button"
            onClick={refreshView}
            className="h-16 w-16 rounded-full border border-stone-300 bg-white text-2xl font-semibold text-stone-700 shadow-lg"
            aria-label="새로고침"
          >
            ↻
          </button>

          {target === "file" ? (
            <div className="absolute right-[4.5rem] top-1/2 flex -translate-y-1/2 flex-col gap-2">
              <button type="button" onClick={() => setShowUploadPopup(true)} className="h-14 w-14 rounded-full bg-stone-800 text-xs font-semibold text-white shadow-lg">
                추가
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || moveFolderTargets.length === 0 || busy}
                onClick={() => setShowMovePopup(true)}
                className="h-14 w-14 rounded-full border border-sky-200 bg-sky-100 text-xs font-semibold text-sky-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                이동
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || busy}
                onClick={deleteSelectedFiles}
                className="h-14 w-14 rounded-full border border-rose-200 bg-rose-100 text-xs font-semibold text-rose-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                삭제
              </button>
            </div>
          ) : null}

          {target === "folder" ? (
            <div className="absolute right-[4.5rem] top-1/2 flex -translate-y-1/2 flex-col gap-2">
              <button type="button" onClick={() => setShowFolderCreatePopup(true)} className="h-14 w-14 rounded-full bg-stone-800 text-xs font-semibold text-white shadow-lg">
                추가
              </button>
              <button
                type="button"
                disabled={moveFolderTargets.length === 0 || busy}
                onClick={() => setShowFolderMovePopup(true)}
                className="h-14 w-14 rounded-full border border-sky-200 bg-sky-100 text-xs font-semibold text-sky-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                이동
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={deleteCurrentFolder}
                className="h-14 w-14 rounded-full border border-rose-200 bg-rose-100 text-xs font-semibold text-rose-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                삭제
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showUploadPopup
        ? createPortal(
            <div className="fixed inset-0 z-[9998] flex items-end bg-black/40 p-4" onClick={() => setShowUploadPopup(false)}>
              <div className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-stone-900">파일 추가</h3>
                  <button
                    type="button"
                    onClick={() => setShowUploadPopup(false)}
                    className="h-9 rounded-full border border-stone-300 px-3 text-xs font-medium text-stone-700"
                  >
                    닫기
                  </button>
                </div>
                <div className="mt-3">
                  <UploadForm folderId={currentFolderId} folderName={currentFolderName} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showMovePopup
        ? createPortal(
            <div className="fixed inset-0 z-[9998] flex items-end bg-black/40 p-4" onClick={() => setShowMovePopup(false)}>
              <div className="w-full rounded-2xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-base font-semibold text-stone-900">파일 이동</h3>
                <p className="mt-1 text-sm text-stone-600">{selectedIds.length}개 파일 선택됨</p>
                <select
                  value={effectiveTargetFolderId}
                  onChange={(event) => setTargetFolderId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 px-3 text-sm"
                >
                  {moveFolderTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowMovePopup(false)} className="h-11 flex-1 rounded-xl border border-stone-300 text-sm">
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!effectiveTargetFolderId || selectedIds.length === 0 || busy}
                    onClick={moveSelectedFiles}
                    className="h-11 flex-1 rounded-xl bg-blue-600 text-sm text-white disabled:bg-stone-400"
                  >
                    이동하기
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showFolderCreatePopup
        ? createPortal(
            <div className="fixed inset-0 z-[9998] flex items-end bg-black/40 p-4" onClick={() => setShowFolderCreatePopup(false)}>
              <div className="w-full rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-lg font-semibold text-stone-900">폴더 추가</h3>
                {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
                <input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="예: 2026-08-강릉여행-2차"
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm font-medium text-stone-900 placeholder:text-stone-400"
                />
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFolderCreatePopup(false)} className="h-11 flex-1 rounded-xl border border-stone-300 text-sm">
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!newFolderName.trim() || busy}
                    onClick={createSubFolder}
                    className="h-11 flex-1 rounded-xl bg-emerald-600 text-sm text-white disabled:bg-stone-400"
                  >
                    만들기
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showFolderMovePopup
        ? createPortal(
            <div className="fixed inset-0 z-[9998] flex items-end bg-black/40 p-4" onClick={() => setShowFolderMovePopup(false)}>
              <div className="w-full rounded-2xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-base font-semibold text-stone-900">폴더 이동</h3>
                <p className="mt-1 text-sm text-stone-600">현재 폴더를 다른 폴더 아래로 이동합니다.</p>
                <select
                  value={effectiveTargetFolderId}
                  onChange={(event) => setTargetFolderId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 px-3 text-sm"
                >
                  {moveFolderTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFolderMovePopup(false)} className="h-11 flex-1 rounded-xl border border-stone-300 text-sm">
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!effectiveTargetFolderId || busy}
                    onClick={moveCurrentFolder}
                    className="h-11 flex-1 rounded-xl bg-blue-600 text-sm text-white disabled:bg-stone-400"
                  >
                    이동하기
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {current
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4" onClick={closeLightbox}>
              <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="닫기"
                  className="absolute right-2 top-2 z-10 h-10 w-10 rounded-full bg-black/55 text-xl text-white hover:bg-black/70"
                >
                  ×
                </button>

                <button
                  type="button"
                  onClick={prev}
                  aria-label="이전 사진"
                  className="absolute left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-black/55 text-xl text-white hover:bg-black/70"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={next}
                  aria-label="다음 사진"
                  className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-black/55 text-xl text-white hover:bg-black/70"
                >
                  ›
                </button>

                <Image
                  src={`/api/drive/file/${current.id}`}
                  alt={current.name}
                  width={1600}
                  height={1200}
                  className="max-h-[78vh] w-full rounded-2xl object-contain"
                  unoptimized
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
