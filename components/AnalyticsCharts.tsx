"use client";

import { useState } from "react";
import Link from "next/link";
import { inr, km, kmpl1, kmpl2 } from "@/lib/format";

export type AnalyticsData = {
  initialOdometerKm: number;
  latestOdometerKm: number | null;
  totalFuelL: number;
  averageKmpl: number | null;
  bestKmpl: number | null;
  worstKmpl: number | null;
  verifiedKm: number;
  verifiedL: number;
  totalSpendMinor: number;
  avgPricePerLMinor: number | null;
  segments: {
    endedAt: string;
    mileage: number;
    distanceKm: number;
    fuelMl: number;
    included: boolean;
    flag: string | null;
  }[];
  priceHistory: {
    entryAt: string;
    pricePerL: number;
    totalAmountMinor: number;
    litres: number;
  }[];
  monthlyStats: {
    month: string;
    distanceKm: number;
    fuelL: number;
    spendMinor: number;
  }[];
  initialCurrentOdo?: number;
};

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── SVG Line Chart ─────────────────────────────────────────────── */
function LineChart({
  data,
  color,
  formatY,
}: {
  data: { x: string; y: number }[];
  color: string;
  label: string;
  formatY: (v: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 text-xs">
        Fill up fully at least twice to see trend graphs.
      </div>
    );
  }

  const W = 560, H = 180, PX = 16, PY = 28;
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys) * 0.9;
  const maxY = Math.max(...ys) * 1.1;

  const gx = (i: number) => PX + (data.length < 2 ? (W - 2 * PX) / 2 : (i / (data.length - 1)) * (W - 2 * PX));
  const gy = (v: number) => (maxY === minY ? H / 2 : PY + (1 - (v - minY) / (maxY - minY)) * (H - 2 * PY));

  const pts = data.map((d, i) => ({ x: gx(i), y: gy(d.y), label: d.x, val: d.y }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full min-w-[300px] h-auto block">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PX}
            y1={PY + t * (H - 2 * PY)}
            x2={W - PX}
            y2={PY + t * (H - 2 * PY)}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        {pts.length > 1 && <path d={area} fill={`url(#grad-${color.replace("#", "")})`} />}

        {/* Line */}
        {pts.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {/* Points + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4.5" fill={color} stroke="#ffffff" strokeWidth="2" />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>
              {formatY(p.val)}
            </text>
            {(i === 0 || i === pts.length - 1 || pts.length <= 6) && (
              <text x={p.x} y={H + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Bar Chart ──────────────────────────────────────────────────── */
function BarChart({
  data,
  color,
  formatY,
}: {
  data: { label: string; value: number }[];
  color: string;
  formatY: (v: number) => string;
}) {
  if (data.length === 0) {
    return <div className="py-10 text-center text-slate-400 text-xs">No entries recorded yet.</div>;
  }

  const W = 560, H = 160, PX = 16, PY = 28;
  const maxVal = Math.max(...data.map((d) => d.value)) * 1.1 || 1;
  const barW = Math.min(36, (W - 2 * PX) / data.length - 8);
  const barX = (i: number) => PX + (i / data.length) * (W - 2 * PX) + ((W - 2 * PX) / data.length - barW) / 2;
  const barH = (v: number) => (v / maxVal) * (H - 2 * PY);
  const barY = (v: number) => H - PY - barH(v);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full min-w-[300px] h-auto block">
        <line x1={PX} y1={H - PY} x2={W - PX} y2={H - PY} stroke="#e2e8f0" />
        {data.map((d, i) => (
          <g key={i}>
            <rect x={barX(i)} y={barY(d.value)} width={barW} height={barH(d.value)} rx="4" fill={color} fillOpacity="0.8" />
            <text x={barX(i) + barW / 2} y={barY(d.value) - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>
              {formatY(d.value)}
            </text>
            <text x={barX(i) + barW / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {d.label.split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const [currentOdoInput, setCurrentOdoInput] = useState<string>(
    data.initialCurrentOdo ? String(data.initialCurrentOdo) : data.latestOdometerKm ? String(data.latestOdometerKm) : ""
  );

  const baselineKm = data.initialOdometerKm || 0;
  const currentOdoNum = Number(currentOdoInput);
  const hasValidOdo = currentOdoInput.trim() !== "" && !isNaN(currentOdoNum) && currentOdoNum > baselineKm;
  const customDistance = hasValidOdo ? currentOdoNum - baselineKm : data.verifiedKm;

  // Effective fuel litres: use recorded totalFuelL or compute from spend using avg petrol price
  const avgPrice = data.avgPricePerLMinor ? data.avgPricePerLMinor / 100 : 110;
  let effectiveLitres = data.totalFuelL;
  if (effectiveLitres <= 0 && data.totalSpendMinor > 0) {
    effectiveLitres = (data.totalSpendMinor / 100) / avgPrice;
  }

  const customKmpl =
    hasValidOdo && customDistance > 0 && effectiveLitres > 0
      ? customDistance / effectiveLitres
      : data.averageKmpl;

  const customCostPerKm =
    hasValidOdo && customDistance > 0 && data.totalSpendMinor > 0
      ? data.totalSpendMinor / customDistance
      : null;

  const incSegments = data.segments.filter((s) => s.included);
  const mileagePoints = incSegments.map((s) => ({ x: day(s.endedAt), y: s.mileage }));
  const pricePoints = data.priceHistory.map((h) => ({ x: day(h.entryAt), y: h.pricePerL }));
  const monthlyDistBar = [...data.monthlyStats].reverse().map((m) => ({ label: m.month, value: m.distanceKm }));
  const monthlySpendBar = [...data.monthlyStats].reverse().map((m) => ({ label: m.month, value: m.spendMinor / 100 }));

  return (
    <div className="space-y-6">
      {/* Interactive Mileage & Distance Calculator Card */}
      <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052cc] flex items-center justify-center font-black text-sm">
                ⚡
              </div>
              <h2 className="text-lg font-black text-slate-900">Vehicle Average & Distance Breakdown</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calculates your true mileage between start reading ({km(baselineKm)}) and current odometer using your average petrol price (₹{avgPrice.toFixed(1)}/L).
            </p>
          </div>

          {/* Odometer quick adjuster input */}
          <div className="flex items-center gap-2">
            <label htmlFor="analyticsOdoInput" className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Current Odo (KM):
            </label>
            <div className="relative">
              <input
                id="analyticsOdoInput"
                type="number"
                inputMode="numeric"
                value={currentOdoInput}
                onChange={(e) => setCurrentOdoInput(e.target.value)}
                placeholder="e.g. 2500"
                className="w-32 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">KM</span>
            </div>
          </div>
        </div>

        {/* Live Calculation Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          {/* 1. Distance Travelled */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Distance Travelled
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {km(customDistance)}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              {baselineKm > 0 && hasValidOdo ? `${km(baselineKm)} → ${km(currentOdoNum)}` : "Total logged"}
            </span>
          </div>

          {/* 2. Fuel Consumed */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Fuel Bought
            </span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {effectiveLitres.toFixed(1)} Litres
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
              Avg ₹{avgPrice.toFixed(1)}/L
            </span>
          </div>

          {/* 3. Calculated Average Mileage */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Calculated Average
            </span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              {customKmpl ? kmpl2(customKmpl) : "—"}
            </p>
            <span className="text-[10px] text-emerald-600 mt-0.5 block truncate">
              {customDistance > 0 && effectiveLitres > 0
                ? `${Math.round(customDistance)} km ÷ ${effectiveLitres.toFixed(1)} L`
                : "Enter current odometer"}
            </span>
          </div>

          {/* 4. Cost Per Kilometre */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0052cc] block">
              Cost Per KM
            </span>
            <p className="text-xl font-black text-[#0052cc] mt-0.5">
              {customCostPerKm ? inr(customCostPerKm) : "—"}
            </p>
            <span className="text-[10px] text-blue-600 mt-0.5 block truncate">
              {inr(data.totalSpendMinor)} total spend
            </span>
          </div>
        </div>
      </div>

      {/* Mileage Trend Graph */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Mileage Trend</h3>
        <p className="text-xs text-slate-500 mb-4">km/L per verified fuel cycle</p>
        <LineChart data={mileagePoints} color="#0052cc" label="Mileage (km/L)" formatY={(v) => `${v.toFixed(1)}`} />
      </div>

      {/* Fuel Price Trend Graph */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Fuel Price Trend</h3>
        <p className="text-xs text-slate-500 mb-4">₹ per litre over time</p>
        <LineChart data={pricePoints} color="#0891b2" label="Price (₹/L)" formatY={(v) => `₹${v.toFixed(0)}`} />
      </div>

      {/* Monthly Distance & Spend Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Monthly Distance</h3>
          <p className="text-xs text-slate-500 mb-4">Total km driven each month</p>
          <BarChart data={monthlyDistBar} color="#0052cc" formatY={(v) => `${Math.round(v)}`} />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Monthly Fuel Spend</h3>
          <p className="text-xs text-slate-500 mb-4">Total ₹ spent each month</p>
          <BarChart data={monthlySpendBar} color="#16a34a" formatY={(v) => `₹${Math.round(v)}`} />
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Monthly Breakdown</h3>
        </div>
        {data.monthlyStats.length === 0 ? (
          <div className="px-6 py-8 text-center text-xs text-slate-400">No monthly records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <th className="py-3 px-6">Month</th>
                  <th className="py-3 px-6">Distance (KM)</th>
                  <th className="py-3 px-6">Fuel (Litres)</th>
                  <th className="py-3 px-6">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.monthlyStats.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{m.month}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">
                      {m.distanceKm > 0 ? `${Math.round(m.distanceKm).toLocaleString("en-IN")} km` : "—"}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-600">{m.fuelL.toFixed(1)} L</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-600">{m.spendMinor > 0 ? inr(m.spendMinor) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
