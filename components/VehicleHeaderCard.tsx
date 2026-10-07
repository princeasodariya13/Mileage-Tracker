"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import CheckMileageModal from "./CheckMileageModal";
import VehicleActionsModal, { VehicleData } from "./VehicleActionsModal";

interface VehicleHeaderCardProps {
  vehicle: VehicleData;
  entriesCount: number;
  latestOdometerKm: number | null;
  totalFuelL: number;
  totalSpendMinor: number;
  avgPricePerLitre?: number;
}

export default function VehicleHeaderCard({
  vehicle,
  entriesCount,
  latestOdometerKm,
  totalFuelL,
  totalSpendMinor,
  avgPricePerLitre = 102,
}: VehicleHeaderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  function startPress() {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      setShowModal(true);
    }, 500);
  }

  function endPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <>
      <div
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all select-none relative group"
        title="Long press or tap 3 dots to Edit / Delete vehicle"
      >
        {/* Left: Identity */}
        <div className="flex items-center justify-between sm:justify-start gap-3.5 flex-1">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052cc] flex items-center justify-center font-black text-base flex-shrink-0 border border-blue-100 shadow-2xs">
              {vehicle.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
                  {vehicle.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
                  {vehicle.vehicleType || "Vehicle"}
                </span>
                {vehicle.registrationNumber && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052cc] border border-blue-200 tracking-wider">
                    {vehicle.registrationNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {entriesCount} fuel fill{entriesCount === 1 ? "" : "s"} logged · {vehicle.fuelType || "Petrol"}
                <span className="hidden sm:inline text-slate-400 ml-2">(Hold to edit)</span>
              </p>
            </div>
          </div>

          {/* Quick 3-dots / settings trigger button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
            title="Vehicle Options (Edit / Delete)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[320px]">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Link
              href={`/app/vehicles/${vehicle.id}/add-fuel`}
              prefetch={true}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm text-center"
              style={{ textDecoration: "none" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add Fuel</span>
            </Link>

            <Link
              href={`/app/vehicles/${vehicle.id}/analytics`}
              prefetch={true}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shadow-2xs text-center"
              style={{ textDecoration: "none" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Analytics</span>
            </Link>
          </div>

          <CheckMileageModal
            vehicleId={vehicle.id}
            vehicleName={vehicle.name}
            initialOdometerKm={vehicle.initialOdometerKm || 0}
            latestLoggedOdometerKm={latestOdometerKm}
            totalFuelLitres={totalFuelL}
            totalSpendMinor={totalSpendMinor}
            avgPricePerLitre={avgPricePerLitre}
          />
        </div>
      </div>

      <VehicleActionsModal
        vehicle={vehicle}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpdated={() => window.location.reload()}
      />
    </>
  );
}
