"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";

interface VehicleOption {
  id: string;
  name: string;
}

export default function Header({
  vehicles,
  currentId,
}: {
  vehicles: VehicleOption[];
  currentId?: string;
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentVehicle = vehicles.find((v) => v.id === currentId);

  async function handleLogout() {
    setIsLoggingOut(true);
    await post("/api/auth/logout");
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 bg-[#0052cc] text-white shadow-sm" style={{ zIndex: 9999 }}>
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand / Vehicle Selector */}
        <div className="flex items-center gap-2">
          {currentVehicle ? (
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                prefetch={true}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                title="Back to Garage"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Link>

              <div className="relative" ref={dropdownRef} style={{ zIndex: 9999 }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  title="Click to switch vehicle"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 text-white font-black text-xs">
                    {currentVehicle.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-white max-w-[140px] sm:max-w-[240px] truncate">
                      {currentVehicle.name}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-white/80 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 animate-fade-in text-slate-800"
                    style={{ zIndex: 99999 }}
                  >
                    <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Vehicle
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <Link
                        href="/app"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <span>🚗 All Vehicles (Garage)</span>
                      </Link>
                      {vehicles.map((v) => (
                        <Link
                          key={v.id}
                          href={`/app/vehicles/${v.id}`}
                          prefetch={true}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                            v.id === currentId ? "font-bold text-blue-600 bg-blue-50/70" : "text-slate-700"
                          }`}
                        >
                          <span className="truncate">{v.name}</span>
                          {v.id === currentId && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600 flex-shrink-0">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <Link
                        href="/app/vehicles/new"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span>+ Add New Vehicle</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/app" className="flex items-center gap-2.5 text-white font-bold text-base" style={{ textDecoration: "none" }}>
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Mileage-Tracker"
                  width={34}
                  height={34}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">Mileage-Tracker</span>
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {currentVehicle && (
            <Link
              href={`/app/vehicles/${currentId}/add-fuel`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs"
              style={{ textDecoration: "none" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add Fuel</span>
            </Link>
          )}

          <Link
            href="/app/vehicles/new"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
            style={{ textDecoration: "none" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>New Vehicle</span>
          </Link>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white/90 hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
            title="Log out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal rendered into document.body to avoid stacking context issues */}
      {mounted && showLogoutModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-slate-900"
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Log Out Confirmation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to log out?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              You will need to enter your email and password to log in again. Your saved vehicles and fuel data will remain safe.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-center border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-center text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isLoggingOut ? "Logging out..." : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
