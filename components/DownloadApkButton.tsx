"use client";

import { useEffect, useState } from "react";

export default function DownloadApkButton() {
  const [isInsideApp, setIsInsideApp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if the user is running inside the APK / Android WebView / Standalone app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const isAndroidWebView =
      /Android.*wv/.test(window.navigator.userAgent) ||
      /Version\/.*Chrome\/.*Mobile.*Safari/.test(window.navigator.userAgent) && !window.navigator.userAgent.includes("Chrome/");

    const isAppReferrer = document.referrer?.startsWith("android-app://");

    const urlParams = new URLSearchParams(window.location.search);
    const hasAppQuery =
      urlParams.get("source") === "app" ||
      urlParams.get("source") === "apk" ||
      urlParams.get("inApp") === "true";

    const hasStoredFlag = localStorage.getItem("opened_from_apk") === "true";

    // If query param detected, persist to localStorage so future navigations know it's the app
    if (hasAppQuery) {
      localStorage.setItem("opened_from_apk", "true");
    }

    if (isStandalone || isAndroidWebView || isAppReferrer || hasAppQuery || hasStoredFlag) {
      setIsInsideApp(true);
    }
  }, []);

  // Do not render on server or if opened from inside the installed APK app
  if (!mounted || isInsideApp) {
    return null;
  }

  function handleDownload() {
    localStorage.setItem("downloaded_apk_once", "true");
  }

  return (
    <a
      href="/mileage-tracker.apk"
      download="Mileage-Tracker.apk"
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs hover:shadow-sm transform active:scale-95"
      style={{ textDecoration: "none" }}
      title="Download Android APK"
    >
      {/* Android / Download Icon */}
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="hidden xs:inline sm:inline">Download APK</span>
      <span className="xs:hidden sm:hidden">APK</span>
    </a>
  );
}
