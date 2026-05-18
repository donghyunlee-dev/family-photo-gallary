"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FolderOption = {
  id: string;
  name: string;
};

type UploadFormProps = {
  folders: FolderOption[];
  defaultFolderId: string;
};

export default function UploadForm({ folders, defaultFolderId }: UploadFormProps) {
  const router = useRouter();
  const [folderId, setFolderId] = useState(defaultFolderId);
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
        <label className="mb-1 block text-xs font-medium text-stone-700">업로드 폴더</label>
        <select
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800"
        >
          <option value={defaultFolderId}>현재 폴더</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
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
        disabled={!folderId || !files || files.length === 0 || loading}
        className="h-10 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {loading ? "업로드 중..." : "사진 업로드"}
      </button>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
