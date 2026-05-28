"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VerifyResponse = {
  roomId: string;
  roomName: string;
};

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 12h10m-4-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        setError(data.error ?? "Unable to enter. Please try again.");
        return;
      }

      const data = (await response.json()) as VerifyResponse;
      router.push(`/${data.roomId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await verifyAndEnter(code);
  }

  return (
    <main className="landing-shell">
      <div className="landing-backdrop" aria-hidden="true">
        <div className="landing-glow landing-glow-left" />
        <div className="landing-glow landing-glow-right" />
        <div className="landing-film-strip landing-film-strip-left" />
        <div className="landing-film-strip landing-film-strip-right" />
        <div className="landing-photo landing-photo-one" />
        <div className="landing-photo landing-photo-two" />
      </div>

      <section className="landing-content">
        <div className="landing-heading">
          <p className="landing-kicker">Private access</p>
          <h1 className="landing-title">Photo Gallery</h1>
        </div>

        <form onSubmit={handleSubmit} className="landing-form">
          <label htmlFor="room-code" className="sr-only">
            Access code
          </label>
          <div className="landing-input-wrap">
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
              placeholder="000000"
              autoComplete="one-time-code"
              className="input-base pin-input"
            />
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="landing-submit"
              aria-label={loading ? "Checking access code" : "Enter gallery"}
            >
              <ArrowRightIcon />
            </button>
          </div>

          {error ? <p className="landing-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
