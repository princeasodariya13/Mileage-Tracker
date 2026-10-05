"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";

export default function NewVehicleForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const { ok, data } = await post("/api/vehicles", {
      name: f.get("name"),
      vehicleType: f.get("vehicleType"),
      fuelType: f.get("fuelType"),
      registrationNumber: f.get("registrationNumber"),
      tankCapacityL: f.get("tankCapacityL") || null,
      initialOdometerKm: Number(f.get("odometer")),
      tankIsFullNow: f.get("full") === "yes",
    });
    if (ok) {
      router.push(`/app/vehicles/${data.id}`);
      router.refresh();
    } else {
      setError(data.error || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg mx-auto">
      {/* Main Card (Pure White Surface) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Vehicle name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="name">
            Vehicle Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={60}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            placeholder="e.g. Hero Splendor, Honda Activa"
            autoFocus
          />
        </div>

        {/* Type & Fuel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="vt">
              Vehicle Type
            </label>
            <select
              id="vt"
              name="vehicleType"
              defaultValue="motorcycle"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            >
              <option value="motorcycle">Motorcycle / Bike</option>
              <option value="scooter">Scooter</option>
              <option value="car">Car</option>
              <option value="suv">SUV</option>
              <option value="pickup">Pickup</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="ft">
              Fuel Type
            </label>
            <select
              id="ft"
              name="fuelType"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>
        </div>

        {/* Current Odometer */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="odo">
            Current Odometer (km) <span className="text-rose-500">*</span>
          </label>
          <input
            id="odo"
            name="odometer"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            placeholder="e.g. 12450"
          />
        </div>

        {/* Tank & Reg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="tank">
              Tank Capacity (Litres)
            </label>
            <input
              id="tank"
              name="tankCapacityL"
              inputMode="decimal"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              placeholder="e.g. 9.8"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="reg">
              Registration Number
            </label>
            <input
              id="reg"
              name="registrationNumber"
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              placeholder="e.g. MH 12 AB 1234"
            />
          </div>
        </div>

        {/* Is tank full now */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Is the tank full right now?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors">
              <input type="radio" name="full" value="yes" className="accent-blue-600" />
              <span className="text-xs font-semibold text-slate-800">
                Yes, tank is full
              </span>
            </label>
            <label className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors">
              <input type="radio" name="full" value="no" defaultChecked className="accent-blue-600" />
              <span className="text-xs font-semibold text-slate-800">
                No, or not sure
              </span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/app"
          className="w-1/3 py-3 px-4 rounded-xl font-bold text-sm text-center border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          style={{ textDecoration: "none" }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="w-2/3 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#0052cc] hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
        >
          {busy ? "Saving Vehicle..." : "+ Save Vehicle"}
        </button>
      </div>
    </form>
  );
}
