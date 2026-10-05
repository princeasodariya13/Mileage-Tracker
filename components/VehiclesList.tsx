"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { inr, km } from "@/lib/format";

export type VehicleCardData = {
  id: string;
  name: string;
  vehicleType: string;
  registrationNumber?: string;
  fillCount: number;
  totalSpendMinor: number;
  averageKmpl: number | null;
  lastOdometerKm: number | null;
  lastFillDate: string | null;
};

interface VehiclesListProps {
  vehicles: VehicleCardData[];
}

function timeAgo(dateInput: string | null): string {
  if (!dateInput) return "No fills yet";
  const d = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Filled today";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Filled yesterday";
  if (diffDays < 30) return `Filled ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Filled ${diffMonths}m ago`;
  return `Filled on ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function VehiclesList({ vehicles }: VehiclesListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.registrationNumber && v.registrationNumber.toLowerCase().includes(q)) ||
        v.vehicleType.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  return (
    <div className="space-y-3">
      {/* Search Input Bar (Clean White) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search Vehicle (e.g. Splendor, Activa)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Vehicle Rows (Pure White Cards with High Contrast) */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="16" r="1" />
              <circle cx="20" cy="16" r="1" />
            </svg>
          </div>
          <p className="font-bold text-sm text-slate-900 mb-1">
            {search ? "No matching vehicle found" : "No vehicles in your garage"}
          </p>
          <p className="text-xs text-slate-500 mb-5">
            {search ? "Try searching with a different name" : "Add your vehicle (e.g. Splendor, Activa) to start tracking."}
          </p>
          <Link
            href="/app/vehicles/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0052cc] hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Add New Vehicle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filtered.map((v) => {
            const initials = getInitials(v.name);
            const subtitleParts: string[] = [];
            if (v.registrationNumber) subtitleParts.push(v.registrationNumber);
            subtitleParts.push(`${v.fillCount} fill${v.fillCount === 1 ? "" : "s"}`);
            subtitleParts.push(timeAgo(v.lastFillDate));

            return (
              <Link
                key={v.id}
                href={`/app/vehicles/${v.id}`}
                prefetch={true}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors block"
                style={{ textDecoration: "none" }}
              >
                {/* Left: Avatar + Title & Meta */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 font-extrabold text-xs border border-slate-200">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {v.name}
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                        {v.vehicleType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {subtitleParts.join(" • ")}
                    </p>
                  </div>
                </div>

                {/* Right: Total Spend & Mileage */}
                <div className="flex items-center gap-3 text-right flex-shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-black text-base text-slate-900">
                      {inr(v.totalSpendMinor)}
                    </span>
                    {v.averageKmpl != null ? (
                      <span className="text-xs font-bold text-emerald-600 mt-0.5">
                        ⚡ {v.averageKmpl.toFixed(1)} km/L
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {v.lastOdometerKm != null ? km(v.lastOdometerKm) : "0 km"}
                      </span>
                    )}
                  </div>

                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-300">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/app/vehicles/new"
          className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white bg-[#be185d] hover:bg-[#9d174d] shadow-lg transition-transform active:scale-95"
          style={{ textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>ADD VEHICLE</span>
        </Link>
      </div>
    </div>
  );
}
