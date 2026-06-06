"use client";

import { ANDROID_APK_URL } from "@/lib/app/android-config";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4v9m0 0 3.75-3.75M12 13l-3.75-3.75M5 16.5v.75A1.75 1.75 0 0 0 6.75 19h10.5A1.75 1.75 0 0 0 19 17.25v-.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DownloadAppButton() {
  const isConfigured = Boolean(ANDROID_APK_URL);

  return (
    <div className="download-mini-wrap" aria-label="Android app download">
      <p className="download-mini-label">Android app</p>
      <a
        className={`download-mini-button ${isConfigured ? "" : "is-disabled"}`.trim()}
        href={isConfigured ? ANDROID_APK_URL : undefined}
        target={isConfigured ? "_blank" : undefined}
        rel={isConfigured ? "noreferrer" : undefined}
        aria-disabled={!isConfigured}
        aria-label={isConfigured ? "Download Android APK" : "Download link unavailable"}
        title={isConfigured ? "Download Android APK" : "Download link unavailable"}
      >
        <DownloadIcon />
        <span>{isConfigured ? "Install app" : "Link unavailable"}</span>
      </a>
    </div>
  );
}
