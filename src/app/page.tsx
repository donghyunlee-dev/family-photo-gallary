"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VerifyResponse = {
  roomId: string;
  roomName: string;
};

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = useMemo(() => /^\d{6}$/.test(code), [code]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "입장에 실패했습니다. 다시 시도해 주세요.");
        return;
      }

      const data = (await response.json()) as VerifyResponse;
      router.push(`/${data.roomId}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        {/* Simple decorative motif */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="18" r="17" stroke="var(--accent)" strokeWidth="1.5" />
          <path
            d="M11 22c1.5-4 3.5-7 7-7s5.5 3 7 7"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="18" cy="13" r="2.5" fill="var(--primary)" />
        </svg>
        <h1 className="font-serif text-2xl font-semibold text-[color:var(--foreground)] tracking-tight">
          가족 사진첩
        </h1>
        <p className="text-sm text-[color:var(--foreground-secondary)]">소중한 우리 가족의 추억</p>
      </div>

      {/* Entry card */}
      <div className="card w-full max-w-xs p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="room-code"
              className="text-xs font-semibold uppercase tracking-wider text-[color:var(--foreground-secondary)]"
            >
              입장 코드
            </label>
            <input
              id="room-code"
              name="room-code"
              value={code}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(next);
              }}
              inputMode="numeric"
              maxLength={6}
              placeholder="6자리 숫자"
              autoComplete="one-time-code"
              className="input-base text-center text-xl tracking-[0.3em] font-semibold"
            />
          </div>

          {error ? (
            <p className="rounded-[calc(var(--radius)/2)] border border-[#f5c6c0] bg-[color:var(--danger-light)] px-3 py-2 text-xs text-[color:var(--danger)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="btn-primary w-full"
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-[color:var(--foreground-secondary)]">
        공유받은 코드를 입력하세요
      </p>
    </main>
  );
}
