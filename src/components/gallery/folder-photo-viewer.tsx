"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

type PhotoItem = { id: string; name: string };
type FolderPhotoViewerProps = { photos: PhotoItem[] };

export default function FolderPhotoViewer({ photos }: FolderPhotoViewerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const current = activeIndex !== null ? photos[activeIndex] : null;

  const openAt = useCallback((index: number) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(() => {
    setActiveIndex((v) => (v === null ? v : v === 0 ? photos.length - 1 : v - 1));
  }, [photos.length]);
  const next = useCallback(() => {
    setActiveIndex((v) => (v === null ? v : v === photos.length - 1 ? 0 : v + 1));
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, prev, next]);

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-thumb"
            onClick={() => openAt(index)}
            role="button"
            tabIndex={0}
            aria-label={photo.name}
            onKeyDown={(e) => e.key === "Enter" && openAt(index)}
          >
            <Image
              src={`/api/drive/file/${photo.id}`}
              alt={photo.name}
              fill
              sizes="(max-width: 480px) 33vw, (max-width: 768px) 33vw, 200px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>

      {current
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black" onClick={close}>
              <button type="button" onClick={close} aria-label="닫기"
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
