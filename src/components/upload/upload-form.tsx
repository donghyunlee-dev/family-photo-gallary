"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UploadFormProps = { folderId: string };
type UploadSessionResponse = { error?: string; uploadUrl?: string };
const CHUNK_SIZE = 3 * 1024 * 1024;

async function createUploadSession(input: { folderId: string; file: File }) {
  const response = await fetch("/api/drive/upload/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folderId: input.folderId,
      fileName: input.file.name,
      fileSize: input.file.size,
      mimeType: input.file.type || "application/octet-stream",
    }),
  });

  const data = (await response.json()) as UploadSessionResponse;
  if (!response.ok || !data.uploadUrl) {
    throw new Error(data.error ?? "업로드 세션을 만들지 못했습니다.");
  }

  return data.uploadUrl;
}

function uploadSingleFile(input: {
  folderId: string;
  file: File;
  onProgress: (percent: number) => void;
}) {
  const { folderId, file, onProgress } = input;

  return new Promise<void>(async (resolve, reject) => {
    let uploadUrl = "";
    try {
      uploadUrl = await createUploadSession({ folderId, file });
    } catch (error) {
      reject(error);
      return;
    }

    const uploadChunk = (chunk: Blob, startByte: number, endByte: number) =>
      new Promise<void>((chunkResolve, chunkReject) => {
        const formData = new FormData();
        formData.append("uploadUrl", uploadUrl);
        formData.append("mimeType", file.type || "application/octet-stream");
        formData.append("startByte", String(startByte));
        formData.append("endByte", String(endByte));
        formData.append("totalBytes", String(file.size));
        formData.append("chunk", chunk, file.name);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/drive/upload/chunk");
        xhr.timeout = 600000;

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const uploadedBytes = startByte + event.loaded;
          onProgress(Math.min(100, Math.round((uploadedBytes / file.size) * 100)));
        };

        xhr.onload = () => {
          let message = "업로드에 실패했습니다.";
          try {
            const data = JSON.parse(xhr.responseText || "{}") as { error?: string };
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress(Math.min(100, Math.round(((endByte + 1) / file.size) * 100)));
              chunkResolve();
              return;
            }
            message = data.error ?? message;
          } catch {
            if (xhr.responseText) {
              message = xhr.responseText;
            }
          }

          chunkReject(new Error(message));
        };

        xhr.onerror = () => chunkReject(new Error("네트워크 오류가 발생했습니다."));
        xhr.ontimeout = () => chunkReject(new Error("업로드 시간이 초과되었습니다."));
        xhr.send(formData);
      });

    try {
      for (let startByte = 0; startByte < file.size; startByte += CHUNK_SIZE) {
        const endByte = Math.min(file.size - 1, startByte + CHUNK_SIZE - 1);
        const chunk = file.slice(startByte, endByte + 1);
        await uploadChunk(chunk, startByte, endByte);
      }
      onProgress(100);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadWithRetry(input: {
  folderId: string;
  file: File;
  onProgress: (percent: number) => void;
}) {
  try {
    return await uploadSingleFile(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const retryable =
      message.includes("네트워크") ||
      message.includes("시간") ||
      message.includes("502") ||
      message.includes("503");

    if (!retryable) {
      throw error;
    }

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
    return `${completedCount}/${selectedCount}째 ${progress}%`;
  }, [completedCount, loading, progress, selectedCount]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!folderId) {
      setError("폴더 ID가 설정되지 않았습니다.");
      return;
    }
    if (files.length === 0) {
      setError("사진을 먼저 선택해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setProgress(0);
    setCompletedCount(0);

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setCurrentFileName(file.name);
        setProgress(0);
        await uploadWithRetry({
          folderId,
          file,
          onProgress: (value) => setProgress(value),
        });
        setCompletedCount(index + 1);
      }

      setMessage(`${files.length}개 업로드 완료`);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setCurrentFileName("");
      setProgress(0);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[calc(var(--radius)*1.5)] border border-dashed border-[color:var(--border)] bg-[color:var(--background)] px-4 py-5 transition hover:bg-[color:var(--accent-light)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4v12M6 10l6-6 6 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" stroke="var(--foreground-secondary)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-xs font-medium text-[color:var(--foreground-secondary)]">
          {selectedCount > 0 ? `${selectedCount}개 선택됨` : "사진 선택"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="sr-only"
          data-testid="upload-input"
        />
      </label>

      {loading ? (
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
      ) : null}

      <button type="submit" disabled={!canSubmit} className="btn-primary w-full" data-testid="upload-submit">
        {loading ? "업로드 중..." : "업로드"}
      </button>

      {message ? (
        <p className="text-center text-xs font-semibold text-[color:var(--success)]">{message}</p>
      ) : null}
      {error ? (
        <p className="text-center text-xs text-[color:var(--danger)]">{error}</p>
      ) : null}
    </form>
  );
}
