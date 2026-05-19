"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

type PhotoItem = {
  id: string;
  name: string;
};

type FolderPhotoViewerProps = {
  photos: PhotoItem[];
};

export default function FolderPhotoViewer({ photos }: FolderPhotoViewerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const current = activeIndex !== null ? photos[activeIndex] : null;

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const close = useCallback(() => {
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
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, close, prev, next]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <article
            key={photo.id}
            onClick={() => openAt(index)}
            onTouchEnd={() => openAt(index)}
            className="cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white"
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
        ))}
      </div>

      {current
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
              onClick={close}
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
                    onClick={close}
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
