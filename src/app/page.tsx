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
        setError(data.error ?? "ÀÔÀå¿¡ ½ÇÆÐÇß½À´Ï´Ù. ´Ù½Ã ½ÃµµÇØ ÁÖ¼¼¿ä.");
        return;
      }

      const data = (await response.json()) as VerifyResponse;
      router.push(`/${data.roomId}`);
    } catch {
      setError("³×Æ®¿öÅ© ¿À·ù°¡ ¹ß»ýÇß½À´Ï´Ù. Àá½Ã ÈÄ ´Ù½Ã ½ÃµµÇØ ÁÖ¼¼¿ä.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper-bg flex min-h-screen items-center justify-center px-4 py-12 text-stone-900">
      <section className="gallery-paper w-full max-w-md rounded-[1.75rem] p-8">
        <p className="text-sm tracking-wide text-[color:var(--text-secondary)]">Family Photo Gallery</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">°¡Á·»çÁø°ü</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
          °øÀ¯¹ÞÀº 6ÀÚ¸® ÄÚµå¸¦ ÀÔ·ÂÇÏ¸é °¡Á· »çÁø¹æÀ¸·Î ÀÔÀåÇÒ ¼ö ÀÖ¾î¿ä.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label htmlFor="room-code" className="text-sm font-medium text-[color:var(--foreground)]">
            ÀÔÀå ÄÚµå
          </label>
          <input
            id="room-code"
            name="room-code"
            value={code}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(nextValue);
            }}
            inputMode="numeric"
            maxLength={6}
            placeholder="6ÀÚ¸® ¼ýÀÚ"
            autoComplete="one-time-code"
            className="h-12 w-full rounded-xl border border-[color:var(--accent-soft)] bg-white/80 px-4 text-lg tracking-[0.25em] outline-none transition focus:border-[color:var(--primary-warm)]"
          />
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="h-12 w-full rounded-xl bg-[color:var(--accent-terracotta)] text-sm font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {loading ? "È®ÀÎ Áß..." : "ÀÔÀåÇÏ±â"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
