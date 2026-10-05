"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { inr, km, kmpl2 } from "@/lib/format";

interface CheckMileageModalProps {
  vehicleId: string;
  vehicleName: string;
  initialOdometerKm: number;
  latestLoggedOdometerKm: number | null;
  totalFuelLitres: number;
  totalSpendMinor: number;
  avgPricePerLitre?: number;
  className?: string;
}

export default function CheckMileageModal({
  vehicleId,
  vehicleName,
  initialOdometerKm,
  latestLoggedOdometerKm,
  totalFuelLitres,
  totalSpendMinor,
  avgPricePerLitre = 110,
  className = "",
}: CheckMileageModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baselineKm = initialOdometerKm || 0;
  const minSuggestedKm = latestLoggedOdometerKm ? latestLoggedOdometerKm : baselineKm;
  const [currentOdo, setCurrentOdo] = useState<string>("");

  const odoNum = Number(currentOdo);
  const hasEnteredOdo = currentOdo.trim() !== "" && !isNaN(odoNum);
  const distanceTravelled = hasEnteredOdo ? Math.max(0, odoNum - baselineKm) : 0;

  // Total fuel litres: use explicit litres if recorded, or derive from spend using vehicle's average / standard ₹110/L petrol price
  const effectivePrice = avgPricePerLitre > 0 ? avgPricePerLitre : 110;
  let effectiveLitres = totalFuelLitres;
  if (effectiveLitres <= 0 && totalSpendMinor > 0) {
    effectiveLitres = (totalSpendMinor / 100) / effectivePrice;
  }

  const calculatedKmpl =
    hasEnteredOdo && distanceTravelled > 0 && effectiveLitres > 0
      ? distanceTravelled / effectiveLitres
      : null;

  const costPerKm =
    hasEnteredOdo && distanceTravelled > 0 && totalSpendMinor > 0
      ? totalSpendMinor / distanceTravelled
      : null;

  function handleViewAnalytics() {
    setIsOpen(false);
    const param = hasEnteredOdo && odoNum > baselineKm ? `?currentOdo=${odoNum}` : "";
    router.push(`/app/vehicles/${vehicleId}/analytics${param}`);
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setCurrentOdo("");
          setIsOpen(true);
        }}
        className={`w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0052cc] font-bold text-xs transition-colors shadow-2xs cursor-pointer ${className}`}
        title="Check current average based on odometer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m16 12-4-4-4 4" />
          <path d="M12 16V8" />
        </svg>
        <span>⚡ Check Vehicle Average</span>
      </button>

      {/* Modal Dialog with Clean Light Backdrop rendered in Portal */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052cc] flex items-center justify-center font-black text-sm border border-blue-100">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Check Vehicle Average</h3>
                  <p className="text-xs text-slate-500">{vehicleName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Odometer Input Field */}
            <div className="space-y-1.5">
              <label htmlFor="currentOdometerInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Enter Current Vehicle Odometer (KM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="currentOdometerInput"
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  placeholder={`e.g. ${minSuggestedKm > 0 ? minSuggestedKm + 500 : 2500}`}
                  value={currentOdo}
                  onChange={(e) => setCurrentOdo(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
                <span className="absolute right-4 text-xs font-bold text-slate-400">KM</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Starting point: <span className="font-bold text-slate-700">{km(baselineKm)}</span>
                {latestLoggedOdometerKm && latestLoggedOdometerKm > baselineKm && (
                  <span> · Last logged: <span className="font-bold text-slate-700">{km(latestLoggedOdometerKm)}</span></span>
                )}
              </p>
            </div>

            {/* Live Calculation Results Box */}
            {hasEnteredOdo && odoNum > baselineKm ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Distance Driven:</span>
                  <span className="text-sm font-black text-slate-900">
                    {km(distanceTravelled)}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-xs text-slate-600 font-medium block">Total Fuel Used:</span>
                    <span className="text-[10px] text-slate-400">
                      {avgPricePerLitre ? `(avg ₹${avgPricePerLitre.toFixed(1)}/L)` : "(₹110/L standard)"}
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {effectiveLitres.toFixed(1)} Litres
                  </span>
                </div>

                {/* Big Calculated Average */}
                <div className="pt-1 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-500 block">Calculated Average</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {calculatedKmpl ? kmpl2(calculatedKmpl) : "—"}
                    </span>
                  </div>

                  {costPerKm && (
                    <div className="text-right">
                      <span className="text-xs font-bold uppercase text-slate-500 block">Running Cost</span>
                      <span className="text-base font-bold text-blue-600">
                        {inr(costPerKm)} / km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : hasEnteredOdo && odoNum > 0 && odoNum <= baselineKm ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                ⚠️ Current odometer must be greater than your starting odometer ({km(baselineKm)}).
              </div>
            ) : (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-[#0052cc]">How this calculation works:</p>
                <p>
                  Enter your current odometer reading above to instantly see your vehicle&apos;s true mileage and distance driven since start ({km(baselineKm)}). Uses your submitted petrol prices (or ₹110/L standard petrol price) to compute total fuel.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-1/3 py-3 px-3 rounded-xl font-bold text-xs text-center border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleViewAnalytics}
                className="w-2/3 py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#0052cc] hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Full Analytics Breakdown ›</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
