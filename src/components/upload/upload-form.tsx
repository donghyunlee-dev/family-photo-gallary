"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UploadFormProps = {
  folderId: string;
  folderName?: string;
};

type UploadResponse = {
  error?: string;
  uploadedCount?: number;
};

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

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      let data: UploadResponse = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(data);
        return;
      }

      reject(new Error(data.error ?? "업로드에 실패했습니다."));
    };

    xhr.onerror = () => reject(new Error("네트워크 오류가 발생했습니다. 다시 시도해 주세요."));
    xhr.send(formData);
  });
}

export default function UploadForm({ folderId, folderName }: UploadFormProps) {
  const router = useRouter();
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
    return `${completedCount}/${selectedCount} 완료 · ${progress}%`;
  }, [completedCount, loading, progress, selectedCount]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    if (!folderId) {
      setError("업로드 대상 폴더가 설정되지 않았습니다. 관리자에게 폴더 ID 설정을 확인해 주세요.");
      setMessage("");
      return;
    }

    if (files.length === 0) {
      setError("업로드할 사진을 먼저 선택해 주세요.");
      setMessage("");
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

        await uploadSingleFile({
          folderId,
          file,
          onProgress: (percent) => setProgress(percent),
        });

        setCompletedCount(index + 1);
      }

      setMessage(`${files.length}장 업로드 완료`);
      setFiles([]);
      router.refresh();
    } catch (submitError) {
      const uploadErrorMessage =
        submitError instanceof Error ? submitError.message : "업로드 중 오류가 발생했습니다.";
      setError(uploadErrorMessage);
    } finally {
      setLoading(false);
      setCurrentFileName("");
      setProgress(0);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-stone-600">현재 폴더</p>
          <span className="max-w-[65%] truncate rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-800">
            {folderName ?? "현재 위치"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-stone-800">사진 선택</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
        />
        <p className="text-xs text-stone-500">선택된 파일 {selectedCount}개</p>
      </div>

      {selectedCount > 0 ? (
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-2">
          {files.map((file, index) => {
            const isCompleted = index < completedCount;
            const isCurrent = loading && index === completedCount;
            return (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-stone-700">{file.name}</span>
                <span className={isCompleted ? "text-emerald-700" : isCurrent ? "text-blue-700" : "text-stone-500"}>
                  {isCompleted ? "완료" : isCurrent ? "업로드 중" : "대기"}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between text-xs font-medium text-blue-900">
            <span className="truncate">{currentFileName || "업로드 준비 중"}</span>
            <span>{progressLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-11 w-full rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {loading ? "업로드 진행 중..." : "사진 업로드"}
      </button>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
