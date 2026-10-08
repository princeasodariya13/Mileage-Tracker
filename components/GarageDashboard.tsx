"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { inr, km, kmpl2, litres } from "@/lib/format";
import VehiclesList, { VehicleCardData } from "./VehiclesList";

export type GarageActivity = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  entryAt: string;
  totalAmountMinor: number | null;
  fuelMl: number | null;
  odometerKm: number | null;
  mileage: number | null;
};

export type GarageOverviewData = {
  totalSpendMinor: number;
  totalTrackedKm: number;
  totalFuelLitres: number;
  fleetAverageKmpl: number | null;
  vehiclesCount: number;
  totalFillsCount: number;
  vehicleCards: VehicleCardData[];
  recentActivity: GarageActivity[];
};

export default function GarageDashboard({ data }: { data: GarageOverviewData }) {
  const [activeTab, setActiveTab] = useState<"vehicles" | "overview">("vehicles");

  const sortedVehiclesByEfficiency = useMemo(() => {
    return [...data.vehicleCards].sort((a, b) => {
      const aM = a.averageKmpl ?? 0;
      const bM = b.averageKmpl ?? 0;
      return bM - aM;
    });
  }, [data.vehicleCards]);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-24 space-y-4">
      {/* Top Navigation Tab Bar */}
      <div className="flex items-center gap-6 border-b border-slate-200 px-1">
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`text-xs sm:text-sm font-extrabold pb-3 transition-colors relative cursor-pointer ${
            activeTab === "vehicles"
              ? "text-blue-600 border-b-2 border-blue-600 font-black"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          VEHICLES ({data.vehiclesCount})
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`text-xs sm:text-sm font-extrabold pb-3 transition-colors relative cursor-pointer ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600 font-black"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          GARAGE OVERVIEW
        </button>
      </div>

      {activeTab === "vehicles" ? (
        <div className="space-y-4">
          {/* Dual Summary Card (High Contrast White Surface) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-100 p-4 sm:p-5">
              {/* Left: Total Spent */}
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-500">
                  Total fuel spent
                </span>
                <p className="text-2xl font-black mt-1 text-emerald-600">
                  {inr(data.totalSpendMinor)}
                </p>
              </div>

              {/* Right: Total Tracked */}
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-500">
                  Total tracked
                </span>
                <p className="text-2xl font-black mt-1 text-blue-600">
                  {data.vehiclesCount} {data.vehiclesCount === 1 ? "Vehicle" : "Vehicles"}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicles List component */}
          <VehiclesList vehicles={data.vehicleCards} />
        </div>
      ) : (
        /* Garage Overview Detailed Fleet Analytics Tab */
        <div className="space-y-5 animate-fade-in">
          {/* 4 Fleet Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Total Spend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Spend
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {inr(data.totalSpendMinor)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.totalFillsCount} fill{data.totalFillsCount === 1 ? "" : "s"} logged
              </p>
            </div>

            {/* 2. Total Distance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Distance
              </span>
              <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                {km(data.totalTrackedKm)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Across {data.vehiclesCount} vehicle{data.vehiclesCount === 1 ? "" : "s"}
              </p>
            </div>

            {/* 3. Total Fuel Volume */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Fuel
              </span>
              <p className="text-xl sm:text-2xl font-black text-purple-600 mt-1">
                {data.totalFuelLitres.toFixed(1)} L
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Fuel consumed
              </p>
            </div>

            {/* 4. Fleet Efficiency */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Fleet Average
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {data.fleetAverageKmpl != null ? `${data.fleetAverageKmpl.toFixed(1)} km/L` : "—"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Overall efficiency
              </p>
            </div>
          </div>

          {/* Vehicle Efficiency & Cost Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
                Fleet Performance Breakdown
              </h3>
              <span className="text-xs text-slate-500 flex-shrink-0">
                {data.vehiclesCount} Active {data.vehiclesCount === 1 ? "Vehicle" : "Vehicles"}
              </span>
            </div>

            {data.vehicleCards.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No vehicles in garage.</p>
            ) : (
              <div className="space-y-3">
                {sortedVehiclesByEfficiency.map((v) => {
                  const spendPercent =
                    data.totalSpendMinor > 0
                      ? Math.round((v.totalSpendMinor / data.totalSpendMinor) * 100)
                      : 0;

                  return (
                    <Link
                      key={v.id}
                      href={`/app/vehicles/${v.id}`}
                      className="block p-3 sm:p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/80 transition-all overflow-hidden"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="flex items-center justify-between gap-2.5 mb-2.5">
                        {/* Left Info: Name & Badges */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 truncate max-w-[120px] sm:max-w-[180px]">
                              {v.name}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize flex-shrink-0">
                              {v.vehicleType}
                            </span>
                            {v.registrationNumber && (
                              <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
                                {v.registrationNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Info: Total Spend & Mileage Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center items-end gap-1 sm:gap-2.5 text-right flex-shrink-0">
                          <span className="text-xs sm:text-sm font-black text-emerald-600">
                            {inr(v.totalSpendMinor)}
                          </span>
                          {v.averageKmpl != null ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap">
                              <span>⚡</span>
                              <span>{v.averageKmpl.toFixed(1)} km/L</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              No mileage
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Spend Share Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex items-center">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.max(spendPercent, 4)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 gap-1 flex-wrap">
                        <span>{v.fillCount} fill{v.fillCount === 1 ? "" : "s"} logged</span>
                        <span>{spendPercent}% of garage fuel spend</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Garage Fuel Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Recent Garage Activity
            </h3>

            {data.recentActivity.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No fuel fills logged yet across your vehicles.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentActivity.map((act) => {
                  const dateStr = new Date(act.entryAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <Link
                      key={act.id}
                      href={`/app/vehicles/${act.vehicleId}`}
                      className="py-3 flex items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors rounded-lg px-2 overflow-hidden"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {act.vehicleName}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {dateStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {act.odometerKm != null ? `${km(act.odometerKm)} • ` : ""}
                          {act.fuelMl != null ? litres(act.fuelMl) : ""}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 flex flex-col items-end">
                        <p className="font-black text-sm sm:text-base text-emerald-600">
                          {act.totalAmountMinor != null ? inr(act.totalAmountMinor) : "₹0"}
                        </p>
                        {act.mileage != null && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-600">
                            ⚡ {kmpl2(act.mileage)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
