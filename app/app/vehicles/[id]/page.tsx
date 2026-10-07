import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, oid } from "@/lib/db";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import { inr, km } from "@/lib/format";
import Shell from "@/components/Shell";
import SimpleFuelLedger, { LedgerEntry } from "@/components/SimpleFuelLedger";
import VehicleHeaderCard from "@/components/VehicleHeaderCard";

export default async function Dashboard({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const vid = oid(params.id);
  if (!vid) notFound();
  const d = await db();
  const [v, raw] = await Promise.all([
    d.collection("vehicles").findOne({ _id: vid, userId: user._id }),
    d.collection("fuelEntries").find({ vehicleId: vid, userId: user._id }).toArray(),
  ]);
  if (!v) notFound();
  const entries = sortEntries(raw.map(toEntry));
  const r = computeMileage(v as any, entries);
  const segByEnd = new Map(r.segments.map((s) => [s.endId, s]));
  const rows = [...entries].reverse();

  // Format entries for the SimpleFuelLedger
  const ledgerEntries: LedgerEntry[] = rows.map((e) => {
    const s = segByEnd.get(e.id);
    const st = r.status[e.id];
    return {
      id: e.id,
      entryAt: e.entryAt,
      odometerKm: e.odometerKm,
      fuelMl: e.fuelMl,
      totalAmountMinor: e.totalAmountMinor,
      fullTank: e.fullTank,
      kind: e.kind,
      acknowledged: e.acknowledged,
      notes: (e as any).notes || "",
      mileage: s?.mileage ?? null,
      status: st,
      isFlagged: s?.flag != null,
    };
  });

  return (
    <Shell userId={user._id} currentId={params.id}>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-24 space-y-5">
        {/* Vehicle Identity & Top Actions Header with Long-Press & 3-Dots Edit/Delete */}
        <VehicleHeaderCard
          vehicle={{
            id: v._id.toString(),
            name: v.name,
            vehicleType: v.vehicleType || "motorcycle",
            fuelType: v.fuelType || "petrol",
            registrationNumber: v.registrationNumber || undefined,
            tankCapacityL: v.tankCapacityMl ? v.tankCapacityMl / 1000 : null,
            initialOdometerKm: v.initialOdometerKm || 0,
          }}
          entriesCount={entries.length}
          latestOdometerKm={r.latestOdometerKm}
          totalFuelL={r.totalFuelL}
          totalSpendMinor={r.totalSpendMinor}
          avgPricePerLitre={r.avgPricePerLMinor ? r.avgPricePerLMinor / 100 : 102}
        />

        {/* 4-Card Responsive Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Average Mileage */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Average Mileage
            </span>
            <p className="text-xl sm:text-2xl font-black mt-1 text-[#0052cc]">
              {r.averageKmpl != null ? `${r.averageKmpl.toFixed(1)} km/L` : "—"}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              {r.averageKmpl != null
                ? `${r.includedCount} cycle${r.includedCount === 1 ? "" : "s"} verified`
                : "Need 1 full tank fill"}
            </span>
          </div>

          {/* Card 2: Total Spent */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Fuel Spent
            </span>
            <p className="text-xl sm:text-2xl font-black mt-1 text-emerald-600">
              {inr(r.totalSpendMinor)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              {entries.length} fill{entries.length === 1 ? "" : "s"} total
            </span>
          </div>

          {/* Card 3: Tracked Distance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tracked Distance
            </span>
            <p className="text-xl sm:text-2xl font-black mt-1 text-slate-900">
              {km(r.trackedKm)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              {r.latestOdometerKm != null ? `Odo: ${km(r.latestOdometerKm)}` : "Since start"}
            </span>
          </div>

          {/* Card 4: Total Fuel Bought */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Fuel Bought
            </span>
            <p className="text-xl sm:text-2xl font-black mt-1 text-slate-900">
              {r.totalFuelL.toFixed(1)} L
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
              {r.costPerKmMinor != null ? `${inr(r.costPerKmMinor)}/km` : "All refills"}
            </span>
          </div>
        </div>

        {/* Ledger Entries List with Live Search & Date Grouping */}
        <SimpleFuelLedger vehicleId={params.id} entries={ledgerEntries} />
      </div>
    </Shell>
  );
}
