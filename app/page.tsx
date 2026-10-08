import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import DownloadApkButton from "@/components/DownloadApkButton";

export default async function Home() {
  if (await getUser()) redirect("/app");
  return (
    <div className="page-wrapper min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-6xl mx-auto w-full gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200 overflow-hidden flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Mileage-Tracker Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>Mileage-Tracker</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <DownloadApkButton />
          <Link href="/login" className="inline-flex items-center justify-center px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all shadow-2xs">
            Log in
          </Link>
          <Link href="/signup" className="btn text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="animate-fade-up max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "var(--accent-light)" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <circle cx="5" cy="5" r="5" />
            </svg>
            Smart fuel tracking for Indian vehicles
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none mb-6" style={{ color: "var(--text-primary)" }}>
            Your real{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent-light), var(--accent-2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              mileage,
            </span>
            <br />not a guess.
          </h1>

          <p className="text-lg sm:text-xl mb-10" style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
            Log every fuel fill. Mileage-Tracker works out your actual km/L — full-tank to full-tank, with partials handled correctly.
          </p>

          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link href="/signup" className="btn px-6 py-3 rounded-xl font-semibold text-base shadow-sm">
              Start tracking free
            </Link>
            <Link href="/login" className="btn-plain px-6 py-3 rounded-xl font-semibold text-base border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs">
              Log in
            </Link>
          </div>
        </div>

        {/* Feature chips */}
        <div className="mt-20 flex flex-wrap gap-3 justify-center animate-fade-up delay-2">
          {[
            "Full-tank cycles",
            "Partial fill support",
            "Odometer reset handling",
            "Spend analytics",
            "Mileage trends",
            "Price history",
          ].map((f) => (
            <div key={f} className="px-4 py-2 rounded-full text-sm" style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}>
              {f}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: "var(--text-muted)" }}>
        © 2026 Mileage-Tracker · Mileage tracking done right
      </footer>
    </div>
  );
}
