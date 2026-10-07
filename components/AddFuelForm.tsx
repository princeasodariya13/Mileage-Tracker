"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";

function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AddFuelForm({
  vehicleId,
  lastOdometer,
}: {
  vehicleId: string;
  lastOdometer: number;
}) {
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState("");
  const [entryAt, setEntryAt] = useState(localNow());

  // Optional fields
  const [odometer, setOdometer] = useState("");
  const [litres, setLitres] = useState("");
  const [pricePerLitre, setPricePerLitre] = useState("");
  const [fullTank, setFullTank] = useState(false); // Default to Partial Fill
  const [notes, setNotes] = useState("");
  const [missed, setMissed] = useState(false);
  const [reset, setReset] = useState(false);
  const [prevFinal, setPrevFinal] = useState("");
  const [newStart, setNewStart] = useState("0");

  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const tot = Number(totalAmount);
  const lit = Number(litres);
  const prc = Number(pricePerLitre);

  const calcPricePerL = tot > 0 && lit > 0 ? (tot / lit).toFixed(2) : null;
  const calcLitres = tot > 0 && prc > 0 ? (tot / prc).toFixed(2) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError("Please enter the total fuel amount paid.");
      return;
    }

    setBusy(true);
    setError("");

    const { ok, data } = await post(`/api/vehicles/${vehicleId}/fuel-entries`, {
      entryAt: new Date(entryAt).toISOString(),
      totalAmount: totalAmount,
      odometerKm: odometer ? Number(odometer) : null,
      litres: litres ? litres : (calcLitres ?? ""),
      pricePerLitre: pricePerLitre,
      fullTank,
      notes,
      missedPreviousFill: missed,
      odometerReset: reset ? { previousFinalKm: prevFinal || null, newStartKm: newStart || 0 } : null,
    });

    if (ok) {
      // Automatically redirect to the vehicle details & history page without keeping form in history
      window.location.replace(`/app/vehicles/${vehicleId}`);
    } else {
      setBusy(false);
      setError(data?.error || "Something went wrong.");
    }
  }

  if (message) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Fuel Fill Saved!</h2>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          <button
            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            onClick={() => {
              setMessage("");
              setTotalAmount("");
              setOdometer("");
              setLitres("");
            }}
          >
            + Add Another Fill
          </button>
          <Link
            href={`/app/vehicles/${vehicleId}`}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-center border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Back to Vehicle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg mx-auto">
      {/* Primary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Total Amount Input */}
        <div>
          <label htmlFor="totalAmount" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Total Fuel Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-lg font-bold text-slate-400">₹</span>
            <input
              id="totalAmount"
              name="totalAmount"
              type="number"
              step="any"
              inputMode="decimal"
              required
              autoFocus
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              placeholder="e.g. 500"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
            {[100, 200, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTotalAmount(amt.toString())}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <label htmlFor="entryAt" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Date & Time <span className="text-rose-500">*</span>
          </label>
          <input
            id="entryAt"
            name="entryAt"
            type="datetime-local"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            value={entryAt}
            onChange={(e) => setEntryAt(e.target.value)}
          />
        </div>
      </div>

      {/* Optional Details Accordion */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Optional Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Odometer reading, litres, notes & tank status
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 hover:underline">
            {showOptional ? "Hide ▲" : "Show ▼"}
          </span>
        </button>

        {showOptional && (
          <div className="space-y-4 pt-4 mt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Odometer */}
              <div>
                <label htmlFor="odometer" className="block text-xs font-semibold text-slate-700 mb-1">
                  Odometer (km)
                </label>
                <input
                  id="odometer"
                  name="odometer"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  placeholder={lastOdometer > 0 ? `Last: ${lastOdometer}` : "e.g. 12450"}
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                />
              </div>

              {/* Litres */}
              <div>
                <label htmlFor="litres" className="block text-xs font-semibold text-slate-700 mb-1">
                  Fuel Litres (L)
                </label>
                <input
                  id="litres"
                  name="litres"
                  inputMode="decimal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  placeholder="e.g. 5.2"
                  value={litres}
                  onChange={(e) => setLitres(e.target.value)}
                />
              </div>
            </div>

            {/* Price per litre */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="pricePerLitre" className="block text-xs font-semibold text-slate-700">
                  Fuel Price / Litre (₹)
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Default: ₹102/L
                </span>
              </div>
              <input
                id="pricePerLitre"
                name="pricePerLitre"
                inputMode="decimal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                placeholder="e.g. 105 (leave empty to use default ₹102/L)"
                value={pricePerLitre}
                onChange={(e) => setPricePerLitre(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {tot > 0
                  ? `Calculated fuel for this fill: ~${(tot / (Number(pricePerLitre) || 102)).toFixed(2)} L (at ₹${pricePerLitre || 102}/L)`
                  : "If left blank, standard ₹102/L is used for this specific fill."}
              </p>
            </div>

            {/* Fill Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fill Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-colors ${
                    fullTank
                      ? "border-blue-500 bg-blue-50/60 text-blue-700 font-bold"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="fill"
                    checked={fullTank}
                    onChange={() => setFullTank(true)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs">Full Tank Fill</span>
                </label>
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-colors ${
                    !fullTank
                      ? "border-blue-500 bg-blue-50/60 text-blue-700 font-bold"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="fill"
                    checked={!fullTank}
                    onChange={() => setFullTank(false)}
                    className="accent-blue-600"
                  />
                  <span className="text-xs">Partial Fill</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Fuel Station
              </label>
              <input
                id="notes"
                name="notes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                placeholder="e.g. Indian Oil, highway pump"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
      >
        {busy ? (
          "Saving..."
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>Save Fuel Fill</span>
          </>
        )}
      </button>
    </form>
  );
}
