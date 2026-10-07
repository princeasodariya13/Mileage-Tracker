"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export default function DownloadApkButton() {
  const [isInsideApp, setIsInsideApp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Check if the user is currently running inside the installed APK / WebAPK / Standalone App
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const isAndroidWebView =
      /Android.*wv/.test(window.navigator.userAgent) ||
      (/Version\/.*Chrome\/.*Mobile.*Safari/.test(window.navigator.userAgent) && !window.navigator.userAgent.includes("Chrome/"));

    const isAppReferrer = document.referrer?.startsWith("android-app://");

    const urlParams = new URLSearchParams(window.location.search);
    const hasAppQuery =
      urlParams.get("source") === "app" ||
      urlParams.get("source") === "apk" ||
      urlParams.get("inApp") === "true";

    const hasStoredFlag = localStorage.getItem("opened_from_apk") === "true";

    if (hasAppQuery) {
      localStorage.setItem("opened_from_apk", "true");
    }

    if (isStandalone || isAndroidWebView || isAppReferrer || hasAppQuery || hasStoredFlag) {
      setIsInsideApp(true);
      return;
    }

    // 2. Listen for Android native installation event (WebAPK)
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Do not render if opened inside the installed APK app
  if (!mounted || isInsideApp) {
    return null;
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      // Trigger native Android package installation prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        localStorage.setItem("opened_from_apk", "true");
      }
    } else {
      // If browser hasn't fired beforeinstallprompt or desktop, show clean 1-tap install helper
      setShowInstructions(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs hover:shadow-sm transform active:scale-95 cursor-pointer"
        title="Install Mileage-Tracker App on Mobile"
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
        <span className="hidden xs:inline sm:inline">Install App</span>
        <span className="xs:hidden sm:hidden">Install</span>
      </button>

      {/* Instructions Modal for browsers without direct prompt */}
      {mounted && showInstructions && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-slate-900"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 relative z-10 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-200 flex-shrink-0">
                <Image src="/logo.png" alt="Mileage-Tracker" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Install Mileage-Tracker</h3>
                <p className="text-xs text-slate-500">Add to your phone for instant access</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">1</span>
                <p>Tap your browser menu <strong className="text-slate-900">⋮ (three dots)</strong> or <strong className="text-slate-900">Share</strong> icon.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">2</span>
                <p>Tap <strong className="text-slate-900">Add to Home screen</strong> or <strong className="text-slate-900">Install App</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">3</span>
                <p>The app installs instantly on your phone with full offline access & no URL bar!</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#0052cc] hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-md active:scale-98"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
