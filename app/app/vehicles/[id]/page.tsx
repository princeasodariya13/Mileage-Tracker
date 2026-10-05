import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, oid } from "@/lib/db";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import { inr, km } from "@/lib/format";
import Shell from "@/components/Shell";
import SimpleFuelLedger, { LedgerEntry } from "@/components/SimpleFuelLedger";
import CheckMileageModal from "@/components/CheckMileageModal";

export default async function Dashboard({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const vid = oid(params.id);
  if (!vid) notFound();
  const d = await db();
  const v = await d.collection("vehicles").findOne({ _id: vid, userId: user._id });
  if (!v) notFound();
  const raw = await d.collection("fuelEntries").find({ vehicleId: vid, userId: user._id }).toArray();
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
        {/* Vehicle Identity & Top Actions Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052cc] flex items-center justify-center font-black text-base flex-shrink-0 border border-blue-100">
              {v.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {v.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
                  {v.vehicleType || "Vehicle"}
                </span>
                {v.registrationNumber && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052cc] border border-blue-200 tracking-wider">
                    {v.registrationNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {entries.length} fuel fill{entries.length === 1 ? "" : "s"} logged · {v.fuelType || "Petrol"}
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Fuel & Analytics top row, Check Vehicle Average bottom row */}
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[320px]">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Link
                href={`/app/vehicles/${params.id}/add-fuel`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm text-center"
                style={{ textDecoration: "none" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Add Fuel</span>
              </Link>

              <Link
                href={`/app/vehicles/${params.id}/analytics`}
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
              vehicleId={params.id}
              vehicleName={v.name}
              initialOdometerKm={v.initialOdometerKm || 0}
              latestLoggedOdometerKm={r.latestOdometerKm}
              totalFuelLitres={r.totalFuelL}
              totalSpendMinor={r.totalSpendMinor}
              avgPricePerLitre={r.avgPricePerLMinor ? r.avgPricePerLMinor / 100 : 100}
            />
          </div>
        </div>

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
