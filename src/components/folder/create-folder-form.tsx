"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateFolderFormProps = {
  parentFolderId: string;
};

const SUGGESTIONS = ["2026-05-어린이날", "2026-08-강릉여행", "2026-09-추석"];

export default function CreateFolderForm({ parentFolderId }: CreateFolderFormProps) {
  const router = useRouter();
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!folderName.trim() || loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/drive/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentFolderId,
          folderName: folderName.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string; folder?: { name?: string } };
      if (!response.ok) {
        setError(data.error ?? "폴더 생성에 실패했습니다.");
        return;
      }

      setMessage(`폴더 생성 완료: ${data.folder?.name ?? folderName.trim()}`);
      setFolderName("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="mb-1 block text-xs font-medium text-stone-700">새 폴더 만들기</label>
      <input
        value={folderName}
        onChange={(event) => setFolderName(event.target.value)}
        placeholder="예: 2026-08-강릉여행"
        className="h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800"
      />
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFolderName(value)}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs text-stone-700 hover:bg-stone-100"
          >
            {value}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={!folderName.trim() || loading}
        className="h-10 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {loading ? "생성 중..." : "폴더 만들기"}
      </button>

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
