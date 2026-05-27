"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UploadFormProps = { folderId: string };
type UploadResponse = { error?: string; uploadedCount?: number };

function uploadSingleFile(input: {
  folderId: string;
  file: File;
  onProgress: (percent: number) => void;
}) {
  const { folderId, file, onProgress } = input;
  return new Promise<UploadResponse>((resolve, reject) => {
    const formData = new FormData();
    formData.append("folderId", folderId);
    formData.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/drive/upload");
    xhr.timeout = 600000;

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };

    xhr.onload = () => {
      let data: UploadResponse = {};
      try { data = JSON.parse(xhr.responseText || "{}"); } catch { data = {}; }
      if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); resolve(data); return; }
      reject(new Error(data.error ?? "업로드에 실패했습니다."));
    };

    xhr.onerror = () => reject(new Error("네트워크 오류가 발생했습니다."));
    xhr.ontimeout = () => reject(new Error("업로드 시간이 초과되었습니다."));
    xhr.send(formData);
  });
}

async function uploadWithRetry(input: {
  folderId: string;
  file: File;
  onProgress: (percent: number) => void;
}) {
  try { return await uploadSingleFile(input); }
  catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const retryable = msg.includes("네트워크") || msg.includes("시간이 초과") || msg.includes("502") || msg.includes("503");
    if (!retryable) throw err;
    return uploadSingleFile(input);
  }
}

export default function UploadForm({ folderId }: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [completedCount, setCompletedCount] = useState(0);

  const selectedCount = files.length;
  const canSubmit = !loading && selectedCount > 0;

  const progressLabel = useMemo(() => {
    if (!loading) return "";
    return `${completedCount}/${selectedCount} · ${progress}%`;
  }, [completedCount, loading, progress, selectedCount]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!folderId) { setError("폴더 ID가 설정되지 않았습니다."); return; }
    if (files.length === 0) { setError("사진을 먼저 선택해 주세요."); return; }

    setLoading(true);
    setError("");
    setMessage("");
    setProgress(0);
    setCompletedCount(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileName(file.name);
        setProgress(0);
        await uploadWithRetry({ folderId, file, onProgress: (p) => setProgress(p) });
        setCompletedCount(i + 1);
      }
      setMessage(`${files.length}장 업로드 완료`);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setCurrentFileName("");
      setProgress(0);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {/* File picker */}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[calc(var(--radius)*1.5)] border border-dashed border-[color:var(--border)] bg-[color:var(--background)] px-4 py-5 transition hover:bg-[color:var(--accent-light)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4v12M6 10l6-6 6 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 20h16" stroke="var(--foreground-secondary)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="text-xs font-medium text-[color:var(--foreground-secondary)]">
          {selectedCount > 0 ? `${selectedCount}개 선택됨` : "사진 선택"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="sr-only"
        />
      </label>

      {/* Progress */}
      {loading && (
        <div className="rounded-[var(--radius)] border border-[color:var(--accent-light)] bg-[color:var(--background)] p-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-[color:var(--foreground-secondary)]">
            <span className="max-w-[60%] truncate">{currentFileName || "준비 중..."}</span>
            <span className="font-semibold text-[color:var(--primary)]">{progressLabel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--accent-light)]">
            <div
              className="h-full rounded-full bg-[color:var(--primary)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button type="submit" disabled={!canSubmit} className="btn-primary w-full">
        {loading ? "업로드 중..." : "업로드"}
      </button>

      {message && (
        <p className="text-center text-xs font-semibold text-[color:var(--success)]">{message}</p>
      )}
      {error && (
        <p className="text-center text-xs text-[color:var(--danger)]">{error}</p>
      )}
    </form>
  );
}
