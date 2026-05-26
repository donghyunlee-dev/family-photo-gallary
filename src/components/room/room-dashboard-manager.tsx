"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import UploadForm from "@/components/upload/upload-form";

type PhotoItem = { id: string; name: string };
type FolderItem = { id: string; name: string };
type ActionTarget = "file" | "folder" | null;
type GalleryViewMode = "polaroid" | "photobook" | "wall" | "filmstrip" | "magazine";

type RoomDashboardManagerProps = {
  roomId: string;
  roomName: string;
  roomRootFolderId: string;
  photos: PhotoItem[];
  folders: FolderItem[];
};

export default function RoomDashboardManager({
  roomId,
  roomName,
  roomRootFolderId,
  photos,
  folders,
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
  const [viewMode, setViewMode] = useState<GalleryViewMode>(() => {
    if (typeof window === "undefined") return "polaroid";
    const savedMode = window.localStorage.getItem("room-gallery-view-mode");
    if (savedMode && ["polaroid", "photobook", "wall", "filmstrip", "magazine"].includes(savedMode)) {
      return savedMode as GalleryViewMode;
    }
    return "polaroid";
  });

  const photoSelectionMode = target === "file";
  const folderSelectionMode = target === "folder";

  const currentPhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;
  const viewModes: Array<{ key: GalleryViewMode; label: string }> = [
    { key: "polaroid", label: "폴라로이드" },
    { key: "photobook", label: "포토북" },
    { key: "wall", label: "벽사진" },
    { key: "filmstrip", label: "필름스트립" },
    { key: "magazine", label: "콜라주" },
  ];

  const moveTargets = useMemo(
    () => folders.filter((folder) => !selectedFolderIds.includes(folder.id)),
    [folders, selectedFolderIds],
  );

  const effectiveTargetFolderId =
    targetFolderId && moveTargets.some((folder) => folder.id === targetFolderId)
      ? targetFolderId
      : moveTargets[0]?.id ?? "";

  const closeLightbox = useCallback(() => setActivePhotoIndex(null), []);
  const prev = useCallback(() => {
    setActivePhotoIndex((value) => (value === null ? value : value === 0 ? photos.length - 1 : value - 1));
  }, [photos.length]);
  const next = useCallback(() => {
    setActivePhotoIndex((value) => (value === null ? value : value === photos.length - 1 ? 0 : value + 1));
  }, [photos.length]);

  useEffect(() => {
    if (activePhotoIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePhotoIndex, closeLightbox, prev, next]);

  useEffect(() => {
    window.localStorage.setItem("room-gallery-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const shouldAutoRefresh =
      !showUploadPopup &&
      !showFileMovePopup &&
      !showFolderCreatePopup &&
      !showFolderMovePopup &&
      !busy &&
      activePhotoIndex === null;

    if (!shouldAutoRefresh) return;
    const timer = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [
    activePhotoIndex,
    busy,
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

  function toggleTarget(nextTarget: ActionTarget) {
    setTarget((current) => (current === nextTarget ? null : nextTarget));
    resetSelections();
  }

  function refreshView() {
    setTarget(null);
    resetSelections();
    router.refresh();
  }

  function onPhotoTap(index: number, photoId: string) {
    setError("");
    if (photoSelectionMode) {
      setSelectedPhotoIds((prevIds) =>
        prevIds.includes(photoId) ? prevIds.filter((id) => id !== photoId) : [...prevIds, photoId],
      );
      return;
    }
    setActivePhotoIndex(index);
  }

  function onFolderTap(folderId: string) {
    if (!folderSelectionMode) return;
    setSelectedFolderIds((prevIds) =>
      prevIds.includes(folderId) ? prevIds.filter((id) => id !== folderId) : [...prevIds, folderId],
    );
  }

  function renderPhotoCard(photo: PhotoItem, index: number, className: string) {
    const selected = selectedPhotoIds.includes(photo.id);
    return (
      <article
        key={photo.id}
        onClick={() => onPhotoTap(index, photo.id)}
        className={`cursor-pointer overflow-hidden border bg-white ${className} ${
          selected ? "border-blue-500 ring-2 ring-blue-200" : "border-stone-200"
        }`}
      >
        <Image
          src={`/api/drive/file/${photo.id}`}
          alt={photo.name}
          width={480}
          height={360}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 240px"
          className="h-full w-full object-cover"
        />
      </article>
    );
  }

  function renderGalleryByView() {
    if (viewMode === "filmstrip") {
      return (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {photos.map((photo, index) => (
            <div key={photo.id} className="h-56 w-[72%] shrink-0 snap-start sm:w-72">
              {renderPhotoCard(photo, index, "rounded-2xl")}
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "wall") {
      return (
        <div className="columns-2 gap-3 space-y-3 sm:columns-3 md:columns-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`${index % 3 === 0 ? "rotate-[1deg]" : index % 3 === 1 ? "-rotate-[1deg]" : "rotate-0"} break-inside-avoid`}
            >
              {renderPhotoCard(photo, index, "rounded-sm border-[6px] border-white shadow-md")}
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "magazine") {
      return (
        <div className="grid auto-rows-[140px] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => {
            const big = index % 7 === 0 || index % 7 === 3;
            return (
              <div key={photo.id} className={big ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}>
                {renderPhotoCard(photo, index, "rounded-xl")}
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
              {renderPhotoCard(photo, index, "rounded-2xl")}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className={index % 2 === 0 ? "pt-2" : ""}>
            {renderPhotoCard(photo, index, `rounded-md ${index % 2 === 0 ? "-rotate-[1deg]" : "rotate-[1deg]"}`)}
          </div>
        ))}
      </div>
    );
  }

  async function deleteFiles() {
    if (selectedPhotoIds.length === 0 || busy) return;
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
    if (selectedPhotoIds.length === 0 || !effectiveTargetFolderId || busy) return;

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
          setBusy(false);
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
    if (!newFolderName.trim() || busy) return;

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
    if (selectedFolderIds.length === 0 || !effectiveTargetFolderId || busy) return;

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
          setBusy(false);
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
    if (selectedFolderIds.length === 0 || busy) return;
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
      <div className="fixed inset-x-0 top-0 z-[9993] border-b border-stone-200 bg-stone-100/95 px-4 py-2 backdrop-blur">
        <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{roomName}</h1>
        <p className="mt-1 text-sm text-stone-600">최근 사진 {photos.length}장 · 폴더 {folders.length}개</p>
        <Link
          href="/"
          aria-label="로그아웃"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
        >
          ⎋
        </Link>
        </div>
      </div>
      <div className="h-24" aria-hidden />

      <section className="pb-32 pt-1">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {viewModes.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setViewMode(mode.key)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === mode.key
                  ? "border-stone-700 bg-stone-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        {photos.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">아직 표시할 사진이 없습니다.</p>
        ) : (
          renderGalleryByView()
        )}
      </section>

      <section className="fixed inset-x-0 bottom-0 z-[9992] border-t border-stone-200 bg-white px-4 pb-2 pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full max-w-5xl">
          {folders.length === 0 ? (
            <p className="mt-2 text-xs text-stone-600">아직 생성된 폴더가 없습니다.</p>
          ) : (
            <ul className="mt-1 grid max-h-56 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
              {folders.map((folder) => {
                const selected = selectedFolderIds.includes(folder.id);
                return (
                  <li key={folder.id} className="flex justify-center">
                    <Link
                      href={`/${roomId}/folder/${folder.id}`}
                      onClick={(event) => {
                        if (!folderSelectionMode) return;
                        event.preventDefault();
                        onFolderTap(folder.id);
                      }}
                      className={`flex w-full flex-col items-center ${folderSelectionMode ? "" : ""}`}
                    >
                      <div
                        className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm transition ${
                          selected
                            ? "border-sky-300 bg-sky-100 ring-2 ring-sky-200"
                            : "border-slate-300 bg-slate-100"
                        }`}
                      >
                        <span className="absolute left-2 top-2 h-2.5 w-5 rounded-t-md bg-slate-300" />
                        <span className="mt-1 h-7 w-10 rounded-md bg-slate-400" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-center text-[11px] font-medium text-stone-800">{folder.name}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div
        className="fixed right-4 z-[9997]"
        style={{ bottom: "max(10rem, calc(env(safe-area-inset-bottom) + 9.5rem))" }}
      >
        <div className="relative flex flex-col gap-3">
          <button
            type="button"
            onClick={() => toggleTarget("file")}
            className={`h-16 w-16 rounded-full text-sm font-semibold shadow-lg ${target === "file" ? "bg-sky-200 text-sky-900" : "bg-stone-700 text-white"}`}
          >
            파일
          </button>
          <button
            type="button"
            onClick={() => toggleTarget("folder")}
            className={`h-16 w-16 rounded-full text-sm font-semibold shadow-lg ${target === "folder" ? "bg-emerald-200 text-emerald-900" : "bg-stone-700 text-white"}`}
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
              <button type="button" onClick={() => setShowUploadPopup(true)} className="h-14 w-14 rounded-full bg-stone-800 text-xs font-semibold text-white shadow-lg">추가</button>
              <button
                type="button"
                disabled={selectedPhotoIds.length === 0 || moveTargets.length === 0 || busy}
                onClick={() => setShowFileMovePopup(true)}
                className="h-14 w-14 rounded-full border border-sky-200 bg-sky-100 text-xs font-semibold text-sky-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                이동
              </button>
              <button
                type="button"
                disabled={selectedPhotoIds.length === 0 || busy}
                onClick={deleteFiles}
                className="h-14 w-14 rounded-full border border-rose-200 bg-rose-100 text-xs font-semibold text-rose-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                삭제
              </button>
            </div>
          ) : null}

          {target === "folder" ? (
            <div className="absolute right-[4.5rem] top-1/2 flex -translate-y-1/2 flex-col gap-2">
              <button type="button" onClick={() => setShowFolderCreatePopup(true)} className="h-14 w-14 rounded-full bg-stone-800 text-xs font-semibold text-white shadow-lg">추가</button>
              <button
                type="button"
                disabled={selectedFolderIds.length === 0 || moveTargets.length === 0 || busy}
                onClick={() => setShowFolderMovePopup(true)}
                className="h-14 w-14 rounded-full border border-sky-200 bg-sky-100 text-xs font-semibold text-sky-900 shadow-lg disabled:bg-stone-200 disabled:text-stone-500"
              >
                이동
              </button>
              <button
                type="button"
                disabled={selectedFolderIds.length === 0 || busy}
                onClick={deleteFolders}
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
                  <UploadForm folderId={roomRootFolderId} folderName={roomName} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showFileMovePopup
        ? createPortal(
            <div className="fixed inset-0 z-[9998] flex items-end bg-black/40 p-4" onClick={() => setShowFileMovePopup(false)}>
              <div className="w-full rounded-2xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-base font-semibold text-stone-900">파일 이동</h3>
                <p className="mt-1 text-sm text-stone-600">{selectedPhotoIds.length}개 파일 선택됨</p>
                <select
                  value={effectiveTargetFolderId}
                  onChange={(event) => setTargetFolderId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 px-3 text-sm"
                >
                  {moveTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFileMovePopup(false)} className="h-11 flex-1 rounded-xl border border-stone-300 text-sm">취소</button>
                  <button
                    type="button"
                    disabled={!effectiveTargetFolderId || selectedPhotoIds.length === 0 || busy}
                    onClick={moveFiles}
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
                  placeholder="예: 2026-08-강릉여행"
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-sm font-medium text-stone-900 placeholder:text-stone-400"
                />
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFolderCreatePopup(false)} className="h-11 flex-1 rounded-xl border border-stone-300 text-sm">취소</button>
                  <button
                    type="button"
                    disabled={!newFolderName.trim() || busy}
                    onClick={createFolder}
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
                <p className="mt-1 text-sm text-stone-600">{selectedFolderIds.length}개 폴더 선택됨</p>
                <select
                  value={effectiveTargetFolderId}
                  onChange={(event) => setTargetFolderId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 px-3 text-sm"
                >
                  {moveTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setShowFolderMovePopup(false)} className="h-11 flex-1 rounded-xl border border-stone-300 text-sm">취소</button>
                  <button
                    type="button"
                    disabled={!effectiveTargetFolderId || selectedFolderIds.length === 0 || busy}
                    onClick={moveFolders}
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

      {currentPhoto
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
                  src={`/api/drive/file/${currentPhoto.id}`}
                  alt={currentPhoto.name}
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
