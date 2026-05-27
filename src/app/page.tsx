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

  async function verifyAndEnter(inputCode: string) {
    if (!/^\d{6}$/.test(inputCode) || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inputCode }),
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyAndEnter(code);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-8">
      <section className="card w-full max-w-md border-[rgba(159,92,56,0.1)] bg-[rgba(255,253,249,0.92)] p-6 shadow-[0_18px_40px_rgba(64,39,22,0.08)] backdrop-blur sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl tracking-[-0.05em] text-[color:var(--foreground)]">가족 사진방</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              id="room-code"
              name="room-code"
              value={code}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(next);
                if (next.length === 6 && !loading) {
                  queueMicrotask(() => {
                    void verifyAndEnter(next);
                  });
                }
              }}
              inputMode="numeric"
              maxLength={6}
              placeholder="6자리 숫자"
              autoComplete="one-time-code"
              className="input-base h-16 rounded-[1.25rem] border-[rgba(159,92,56,0.16)] bg-white/80 text-center text-2xl tracking-[0.45em] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            />

          {error ? (
            <p className="rounded-[calc(var(--radius)/2)] border border-[#f5c6c0] bg-[color:var(--danger-light)] px-3 py-2 text-xs text-[color:var(--danger)]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="btn-primary mt-2 h-14 w-full rounded-[1.2rem] text-sm tracking-[0.14em] uppercase"
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </form>
      </section>
    </main>
  );
}
