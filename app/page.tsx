import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Home() {
  if (await getUser()) redirect("/app");
  return (
    <div className="page-wrapper min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 22V8l9-6 9 6v14H3z" /><path d="M9 22V12h6v10" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>Mileage-Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-plain text-sm">Log in</Link>
          <Link href="/signup" className="btn text-sm">Get started</Link>
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

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup" className="btn" style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}>
              Start tracking free
            </Link>
            <Link href="/login" className="btn-plain" style={{ fontSize: "1rem", padding: "0.75rem 1.75rem" }}>
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
