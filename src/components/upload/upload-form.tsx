"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UploadFormProps = {
  folderId: string;
  folderName?: string;
};

export default function UploadForm({ folderId, folderName }: UploadFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!folderId || !files || files.length === 0 || loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("folderId", folderId);
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; uploadedCount?: number };
      if (!response.ok) {
        setError(data.error ?? "업로드에 실패했습니다.");
        return;
      }

      setMessage(`${data.uploadedCount ?? files.length}장 업로드 완료`);
      setFiles(null);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-700">업로드 위치</label>
        <div className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {folderName ?? "현재 위치"}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-stone-700">사진 선택</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(event.target.files)}
          className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={!files || files.length === 0 || loading}
        className="h-10 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {loading ? "업로드 중..." : "사진 업로드"}
      </button>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
