"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { day, inr, km, kmpl2, litres } from "@/lib/format";
import DeleteButton from "@/components/DeleteButton";
import AcknowledgeButton from "@/components/AcknowledgeButton";

export type LedgerEntry = {
  id: string;
  entryAt: string | Date;
  odometerKm: number | null;
  fuelMl: number | null;
  totalAmountMinor: number | null;
  fullTank: boolean;
  kind: "refill" | "baseline";
  acknowledged?: boolean;
  notes?: string;
  mileage?: number | null;
  status?: string;
  isFlagged?: boolean;
};

interface SimpleFuelLedgerProps {
  vehicleId: string;
  entries: LedgerEntry[];
}

function formatDateHeader(dateInput: string | Date): { header: string; relative: string } {
  const d = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let relative = "";
  if (diffHours < 1) relative = "today";
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays === 1) relative = "yesterday";
  else if (diffDays < 30) relative = `${diffDays} days ago`;
  else {
    const months = Math.floor(diffDays / 30);
    relative = `${months} month${months > 1 ? "s" : ""} ago`;
  }

  const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return { header: dateStr, relative };
}

function formatTime(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function SimpleFuelLedger({ vehicleId, entries }: SimpleFuelLedgerProps) {
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) => {
      const notes = (e.notes || "").toLowerCase();
      const dateStr = day(e.entryAt).toLowerCase();
      const amountStr = e.totalAmountMinor ? (e.totalAmountMinor / 100).toString() : "";
      const odoStr = e.odometerKm ? e.odometerKm.toString() : "";
      return notes.includes(q) || dateStr.includes(q) || amountStr.includes(q) || odoStr.includes(q);
    });
  }, [entries, search]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { dateKey: string; dateObj: Date; items: LedgerEntry[] }[] = [];
    for (const e of filteredEntries) {
      const d = new Date(e.entryAt);
      const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let group = groups.find((g) => g.dateKey === dateKey);
      if (!group) {
        group = { dateKey, dateObj: d, items: [] };
        groups.push(group);
      }
      group.items.push(e);
    }
    return groups;
  }, [filteredEntries]);

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search fuel fills by note, date, or ₹ amount..."
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

      {/* Date-Grouped History Entries */}
      {groupedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <p className="font-bold text-base text-slate-900 mb-1">
            {search ? "No matching fills found" : "No fuel fills logged yet"}
          </p>
          <p className="text-xs text-slate-500 mb-5">
            {search ? "Try a different search keyword" : "Click below to log your first fuel fill and start calculating mileage."}
          </p>
          <Link
            href={`/app/vehicles/${vehicleId}/add-fuel`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            + Add First Fuel Fill
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedEntries.map((group) => {
            const { header, relative } = formatDateHeader(group.dateObj);
            return (
              <div key={group.dateKey} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-500 tracking-wide">
                    {header} {relative ? `• ${relative}` : ""}
                  </span>
                  <span className="text-xs text-slate-400">
                    {group.items.length} fill{group.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Entry Cards */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                  {group.items.map((e) => {
                    const hasMileage = e.mileage != null;
                    const timeStr = formatTime(e.entryAt);
                    const dayStr = day(e.entryAt);

                    return (
                      <div
                        key={e.id}
                        className="p-4 sm:p-4.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                      >
                        {/* Left Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {dayStr} · {timeStr}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                e.kind === "baseline"
                                  ? "bg-purple-100 text-purple-700"
                                  : e.fullTank
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {e.kind === "baseline" ? "Baseline" : e.fullTank ? "Full Tank" : "Partial"}
                            </span>
                            {e.isFlagged && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                Needs Review
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {e.notes && (
                            <p className="text-xs font-medium text-slate-600 mt-1 truncate">
                              {e.notes}
                            </p>
                          )}

                          {/* Meta: Odometer & Litres */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                            {e.odometerKm != null && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                                {km(e.odometerKm)}
                              </span>
                            )}
                            {e.fuelMl != null && (
                              <span className="font-medium text-slate-600">
                                {litres(e.fuelMl)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount, Mileage & Actions */}
                        <div className="flex items-center gap-4 text-right flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-lg sm:text-xl text-emerald-600 tracking-tight">
                              {e.totalAmountMinor != null ? inr(e.totalAmountMinor) : "₹ 0"}
                            </span>
                            {hasMileage ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 border border-emerald-200">
                                <span>⚡</span>
                                <span>{kmpl2(e.mileage)}</span>
                              </span>
                            ) : e.kind === "baseline" ? (
                              <span className="text-xs font-semibold text-purple-600 mt-0.5">
                                Starting point
                              </span>
                            ) : null}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 pl-1">
                            {e.isFlagged && (
                              <AcknowledgeButton id={e.id} currentAck={Boolean(e.acknowledged)} />
                            )}
                            <Link
                              href={`/app/vehicles/${vehicleId}/entries/${e.id}/edit`}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit fill"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>
                            <DeleteButton id={e.id} isFull={e.fullTank} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile-Only Sticky Floating Action Button */}
      <div className="sm:hidden fixed bottom-5 right-5 z-40">
        <Link
          href={`/app/vehicles/${vehicleId}/add-fuel`}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl active:scale-95 transition-transform"
          style={{ textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>ADD FUEL FILL</span>
        </Link>
      </div>
    </div>
  );
}
