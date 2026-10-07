"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { post } from "@/lib/client";

export type VehicleData = {
  id: string;
  name: string;
  vehicleType: string;
  fuelType?: string;
  registrationNumber?: string;
  tankCapacityL?: number | null;
  initialOdometerKm?: number;
};

interface VehicleActionsModalProps {
  vehicle: VehicleData;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const VEHICLE_TYPES = [
  { value: "motorcycle", label: "Motorcycle / Bike" },
  { value: "scooter", label: "Scooter / Activa" },
  { value: "car", label: "Car / Sedan / Hatchback" },
  { value: "suv", label: "SUV / Compact SUV" },
  { value: "pickup", label: "Pickup / Van" },
  { value: "other", label: "Other" },
];

export default function VehicleActionsModal({
  vehicle,
  isOpen,
  onClose,
  onUpdated,
}: VehicleActionsModalProps) {
  const [mode, setMode] = useState<"menu" | "edit" | "delete">("menu");
  const [mounted, setMounted] = useState(false);

  // Form states for Edit mode
  const [name, setName] = useState(vehicle.name);
  const [vehicleType, setVehicleType] = useState(vehicle.vehicleType || "motorcycle");
  const [fuelType, setFuelType] = useState(vehicle.fuelType || "petrol");
  const [regNum, setRegNum] = useState(vehicle.registrationNumber || "");
  const [tankCapacity, setTankCapacity] = useState(vehicle.tankCapacityL?.toString() || "");
  const [initialOdo, setInitialOdo] = useState(vehicle.initialOdometerKm?.toString() || "0");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMode("menu");
      setName(vehicle.name);
      setVehicleType(vehicle.vehicleType || "motorcycle");
      setFuelType(vehicle.fuelType || "petrol");
      setRegNum(vehicle.registrationNumber || "");
      setTankCapacity(vehicle.tankCapacityL?.toString() || "");
      setInitialOdo(vehicle.initialOdometerKm?.toString() || "0");
      setError("");
      setBusy(false);
    }
  }, [isOpen, vehicle]);

  if (!mounted || !isOpen || typeof document === "undefined") {
    return null;
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a vehicle name.");
      return;
    }

    setBusy(true);
    setError("");

    const { ok, data } = await post(
      `/api/vehicles/${vehicle.id}`,
      {
        name: name.trim(),
        vehicleType,
        fuelType,
        registrationNumber: regNum.trim() || null,
        tankCapacityL: tankCapacity ? Number(tankCapacity) : null,
        initialOdometerKm: initialOdo !== "" ? Number(initialOdo) : 0,
      },
      "PATCH"
    );

    if (ok) {
      onClose();
      if (onUpdated) {
        onUpdated();
      } else {
        window.location.reload();
      }
    } else {
      setBusy(false);
      setError(data?.error || "Failed to update vehicle details.");
    }
  }

  async function handleDeleteVehicle() {
    setBusy(true);
    setError("");

    const { ok, data } = await post(`/api/vehicles/${vehicle.id}`, undefined, "DELETE");
    if (ok) {
      window.location.replace("/app");
    } else {
      setBusy(false);
      setError(data?.error || "Failed to delete vehicle.");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-slate-900"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052cc] flex items-center justify-center font-black text-xs border border-blue-100">
              {vehicle.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                {mode === "menu"
                  ? vehicle.name
                  : mode === "edit"
                  ? "Edit Vehicle Details"
                  : "Delete Vehicle"}
              </h3>
              <p className="text-xs text-slate-500 capitalize">
                {mode === "menu" ? `${vehicle.vehicleType} • Options` : vehicle.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* 1. Quick Action Menu Mode */}
        {mode === "menu" && (
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50/60 hover:border-blue-300 text-slate-800 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-slate-900">Edit Vehicle Details</p>
                  <p className="text-xs text-slate-500">Change name, vehicle type, registration number, or fuel</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 group-hover:text-blue-600">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setMode("delete")}
              className="w-full p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 text-rose-700 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-rose-900">Delete Vehicle</p>
                  <p className="text-xs text-rose-600/80">Remove this vehicle and all its fuel records</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-rose-400 group-hover:text-rose-600">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* 2. Edit Vehicle Form Mode */}
        {mode === "edit" && (
          <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Vehicle Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hero Splendor, Honda Activa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Registration No.
                </label>
                <input
                  type="text"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  placeholder="e.g. GJ05AB1234"
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tank Capacity (L)
                </label>
                <input
                  type="number"
                  step="any"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Initial Odometer (km)
              </label>
              <input
                type="number"
                value={initialOdo}
                onChange={(e) => setInitialOdo(e.target.value)}
                placeholder="e.g. 12000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("menu")}
                disabled={busy}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-[#0052cc] hover:bg-blue-700 text-white transition-colors shadow-xs"
              >
                {busy ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* 3. Delete Vehicle Confirmation Mode */}
        {mode === "delete" && (
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Warning Box */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 text-rose-700">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
                <h4 className="font-extrabold text-sm text-rose-900">
                  Confirm Vehicle Deletion
                </h4>
              </div>

              <p className="text-xs font-semibold text-rose-900 pt-1">
                Are you sure you want to permanently delete <span className="font-black underline">{vehicle.name}</span>?
              </p>
              <p className="text-xs text-rose-700/90 leading-relaxed">
                All associated fuel fills, spending records, and mileage calculations for this vehicle will be permanently erased. This cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setMode("menu")}
                disabled={busy}
                className="flex-1 py-3 px-3 rounded-xl font-bold text-xs border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                No, Keep Vehicle
              </button>
              <button
                type="button"
                onClick={handleDeleteVehicle}
                disabled={busy}
                className="flex-1 py-3 px-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {busy ? (
                  "Deleting..."
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                    <span>Yes, Delete Vehicle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
