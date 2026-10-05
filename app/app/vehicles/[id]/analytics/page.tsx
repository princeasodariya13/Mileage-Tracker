import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, oid } from "@/lib/db";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import Shell from "@/components/Shell";
import AnalyticsCharts from "@/components/AnalyticsCharts";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { currentOdo?: string };
}) {
  const user = await requireUser();
  const vid = oid(params.id);
  if (!vid) notFound();

  const d = await db();
  const v = await d.collection("vehicles").findOne({ _id: vid, userId: user._id });
  if (!v) notFound();

  const raw = await d.collection("fuelEntries").find({ vehicleId: vid, userId: user._id }).toArray();
  const entries = sortEntries(raw.map(toEntry));
  const res = computeMileage(v as any, entries);

  const refills = entries.filter((e) => e.kind === "refill" && e.fuelMl && e.totalAmountMinor != null);
  const priceHistory = refills.map((e) => {
    const litres = (e.fuelMl as number) / 1000;
    const pricePerL = (e.totalAmountMinor! / 100) / litres;
    return { entryAt: e.entryAt.toISOString(), pricePerL, totalAmountMinor: e.totalAmountMinor!, litres };
  });

  const monthlyMap = new Map<string, { distanceKm: number; fuelL: number; spendMinor: number }>();
  for (const e of entries) {
    if (e.kind === "refill" && e.fuelMl) {
      const date = new Date(e.entryAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const ex = monthlyMap.get(key) || { distanceKm: 0, fuelL: 0, spendMinor: 0 };
      ex.fuelL += e.fuelMl / 1000;
      if (e.totalAmountMinor != null) ex.spendMinor += e.totalAmountMinor;
      monthlyMap.set(key, ex);
    }
  }
  for (const seg of res.segments) {
    if (seg.included) {
      const date = new Date(seg.endedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const ex = monthlyMap.get(key) || { distanceKm: 0, fuelL: 0, spendMinor: 0 };
      ex.distanceKm += seg.distanceKm;
      monthlyMap.set(key, ex);
    }
  }
  const monthlyStats = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, val]) => {
      const [year, monthNum] = key.split("-");
      const monthName = new Date(Number(year), Number(monthNum) - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
      return { month: monthName, ...val };
    });

  const serializableSegments = res.segments.map((s) => ({
    endedAt: s.endedAt.toISOString ? s.endedAt.toISOString() : new Date(s.endedAt).toISOString(),
    mileage: s.mileage,
    distanceKm: s.distanceKm,
    fuelMl: s.fuelMl,
    included: s.included,
    flag: s.flag,
  }));

  const initialCurrentOdo = searchParams?.currentOdo ? Number(searchParams.currentOdo) : undefined;

  return (
    <Shell userId={user._id} currentId={params.id}>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-20">
        {/* Top Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/app/vehicles/${params.id}`}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Back to vehicle dashboard"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {v.name} Analytics & Reports
              </h1>
              <p className="text-xs text-slate-500">Instant average calculation, spend breakdown & monthly trends</p>
            </div>
          </div>

          <Link
            href={`/app/vehicles/${params.id}/add-fuel`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
          >
            + Add Fuel Fill
          </Link>
        </div>

        <AnalyticsCharts
          data={{
            initialOdometerKm: v.initialOdometerKm || 0,
            latestOdometerKm: res.latestOdometerKm,
            totalFuelL: res.totalFuelL,
            averageKmpl: res.averageKmpl,
            bestKmpl: res.bestKmpl,
            worstKmpl: res.worstKmpl,
            verifiedKm: res.verifiedKm,
            verifiedL: res.verifiedL,
            totalSpendMinor: res.totalSpendMinor,
            avgPricePerLMinor: res.avgPricePerLMinor,
            segments: serializableSegments,
            priceHistory,
            monthlyStats,
            initialCurrentOdo,
          }}
        />
      </div>
    </Shell>
  );
}
