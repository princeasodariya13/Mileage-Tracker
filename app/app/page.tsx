import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import { inr, km } from "@/lib/format";
import Shell from "@/components/Shell";
import VehiclesList, { VehicleCardData } from "@/components/VehiclesList";

export default async function AppHome() {
  const user = await requireUser();
  const d = await db();

  const vehiclesRaw = await d.collection("vehicles").find({ userId: user._id }).sort({ createdAt: 1 }).toArray();
  const fuelEntriesRaw = await d.collection("fuelEntries").find({ userId: user._id }).toArray();

  let overallSpendMinor = 0;
  let overallTrackedKm = 0;

  const vehicleCards: VehicleCardData[] = vehiclesRaw.map((v) => {
    const vEntriesRaw = fuelEntriesRaw.filter((e) => e.vehicleId.toString() === v._id.toString());
    const vEntries = sortEntries(vEntriesRaw.map(toEntry));
    const r = computeMileage(v as any, vEntries);

    overallSpendMinor += r.totalSpendMinor;
    overallTrackedKm += r.trackedKm;

    const lastEntry = vEntries.length ? vEntries[vEntries.length - 1] : null;

    return {
      id: v._id.toString(),
      name: v.name,
      vehicleType: v.vehicleType || "motorcycle",
      registrationNumber: v.registrationNumber || undefined,
      fillCount: vEntries.length,
      totalSpendMinor: r.totalSpendMinor,
      averageKmpl: r.averageKmpl,
      lastOdometerKm: r.latestOdometerKm,
      lastFillDate: lastEntry ? new Date(lastEntry.entryAt).toISOString() : null,
    };
  });

  return (
    <Shell userId={user._id}>
      <div className="max-w-2xl mx-auto pb-24">
        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-200 mb-4 px-1">
          <button className="text-sm font-bold pb-2.5 border-b-2 border-blue-600 text-blue-600">
            VEHICLES ({vehiclesRaw.length})
          </button>
          <span className="text-sm font-semibold pb-2.5 text-slate-400 cursor-default">
            GARAGE OVERVIEW
          </span>
        </div>

        {/* Dual Summary Card (Clean White Surface) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-4 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-100 p-4 sm:p-5">
            {/* Left: Total Spent */}
            <div className="text-center">
              <span className="text-xs font-semibold text-slate-500">
                Total fuel spent
              </span>
              <p className="text-2xl font-black mt-1 text-emerald-600">
                {inr(overallSpendMinor)}
              </p>
            </div>

            {/* Right: Total Tracked */}
            <div className="text-center">
              <span className="text-xs font-semibold text-slate-500">
                Total tracked
              </span>
              <p className="text-2xl font-black mt-1 text-blue-600">
                {vehiclesRaw.length} {vehiclesRaw.length === 1 ? "Vehicle" : "Vehicles"}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <VehiclesList vehicles={vehicleCards} />
      </div>
    </Shell>
  );
}
