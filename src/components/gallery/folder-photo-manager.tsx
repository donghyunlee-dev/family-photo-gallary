"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

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
  currentFolderId: string;
  moveTargets: FolderOption[];
};

export default function FolderPhotoManager({
  photos,
  currentFolderId,
  moveTargets,
}: FolderPhotoManagerProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedCount = selectedIds.length;
  const current = activeIndex !== null ? photos[activeIndex] : null;

  const selectableTargets = useMemo(
    () => moveTargets.filter((folder) => folder.id !== currentFolderId),
    [moveTargets, currentFolderId],
  );

  const effectiveTargetFolderId =
    targetFolderId && selectableTargets.some((folder) => folder.id === targetFolderId)
      ? targetFolderId
      : (selectableTargets[0]?.id ?? "");

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((value) => {
      if (value === null) return value;
      return value === 0 ? photos.length - 1 : value - 1;
    });
  }, [photos.length]);

  const next = useCallback(() => {
    setActiveIndex((value) => {
      if (value === null) return value;
      return value === photos.length - 1 ? 0 : value + 1;
    });
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

  function onPhotoTap(index: number, photoId: string) {
    setError("");
    if (selectionMode) {
      setSelectedIds((prevIds) =>
        prevIds.includes(photoId)
          ? prevIds.filter((id) => id !== photoId)
          : [...prevIds, photoId],
      );
      return;
    }
    setActiveIndex(index);
  }

  async function deleteSelected() {
    if (selectedIds.length === 0 || busy) return;
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
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      setSelectedIds([]);
      setSelectionMode(false);
      setFabOpen(false);
      router.refresh();
    } catch {
      setError("네트워크 오류로 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function moveSelected() {
    if (selectedIds.length === 0 || !effectiveTargetFolderId || busy) return;
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
          setError(data.error ?? "이동에 실패했습니다.");
          setBusy(false);
          return;
        }
      }
      setSelectedIds([]);
      setSelectionMode(false);
      setMoveOpen(false);
      setFabOpen(false);
      router.refresh();
    } catch {
      setError("네트워크 오류로 이동에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-stone-600">
          {selectionMode ? `선택 모드 · ${selectedCount}개 선택됨` : "사진을 탭하면 크게 볼 수 있습니다."}
        </p>
        {selectionMode ? (
          <button
            type="button"
            onClick={() => {
              setSelectionMode(false);
              setSelectedIds([]);
            }}
            className="text-xs text-stone-700 underline"
          >
            선택 해제
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => {
          const selected = selectedIds.includes(photo.id);
          return (
            <article
              key={photo.id}
              onClick={() => onPhotoTap(index, photo.id)}
              onTouchEnd={() => onPhotoTap(index, photo.id)}
              className={`cursor-pointer overflow-hidden rounded-2xl border bg-white ${
                selected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-stone-200"
              }`}
            >
              <Image
                src={`/api/drive/file/${photo.id}`}
                alt={photo.name}
                width={640}
                height={440}
                className="h-44 w-full object-cover"
                unoptimized
              />
              <div className="px-3 py-2">
                <p className="truncate text-xs text-stone-700">{photo.name}</p>
              </div>
            </article>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="fixed bottom-6 right-6 z-40">
        {fabOpen ? (
          <div className="mb-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                setSelectionMode((v) => !v);
                if (selectionMode) setSelectedIds([]);
              }}
              className="block w-full rounded-full bg-stone-800 px-4 py-2 text-sm text-white shadow"
            >
              {selectionMode ? "선택 모드 종료" : "선택 모드"}
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || selectableTargets.length === 0 || busy}
              onClick={() => {
                if (!targetFolderId && selectableTargets[0]) {
                  setTargetFolderId(selectableTargets[0].id);
                }
                setMoveOpen(true);
              }}
              className="block w-full rounded-full bg-blue-600 px-4 py-2 text-sm text-white shadow disabled:bg-stone-400"
            >
              파일 이동
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || busy}
              onClick={deleteSelected}
              className="block w-full rounded-full bg-red-600 px-4 py-2 text-sm text-white shadow disabled:bg-stone-400"
            >
              파일 삭제
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setFabOpen((v) => !v)}
          className="h-14 w-14 rounded-full bg-stone-900 text-xl text-white shadow-lg"
          aria-label="파일 작업 메뉴"
        >
          {fabOpen ? "×" : "+"}
        </button>
      </div>

      {moveOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[9998] flex items-end bg-black/40 p-4"
              onClick={() => setMoveOpen(false)}
            >
              <div
                className="w-full rounded-2xl bg-white p-4"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 className="text-base font-semibold text-stone-900">선택 파일 이동</h3>
                <p className="mt-1 text-sm text-stone-600">{selectedCount}개 파일 선택됨</p>
                <select
                  value={effectiveTargetFolderId}
                  onChange={(event) => setTargetFolderId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-stone-300 px-3 text-sm"
                >
                  {selectableTargets.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMoveOpen(false)}
                    className="h-11 flex-1 rounded-xl border border-stone-300 text-sm"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!effectiveTargetFolderId || selectedCount === 0 || busy}
                    onClick={moveSelected}
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
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
              onClick={closeLightbox}
            >
              <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
                <Image
                  src={`/api/drive/file/${current.id}`}
                  alt={current.name}
                  width={1600}
                  height={1200}
                  className="max-h-[78vh] w-full rounded-2xl object-contain"
                  unoptimized
                />
                <p className="mt-3 truncate text-sm text-stone-200">
                  {activeIndex !== null ? `${activeIndex + 1} / ${photos.length}` : ""} · {current.name}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white hover:bg-white/25"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white hover:bg-white/25"
                  >
                    다음
                  </button>
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white hover:bg-white/25"
                  >
                    닫기
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
