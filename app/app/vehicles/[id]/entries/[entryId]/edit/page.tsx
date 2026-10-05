import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, oid } from "@/lib/db";
import Shell from "@/components/Shell";
import EditFuelForm from "@/components/EditFuelForm";

export default async function EditFuelPage({ params }: { params: { id: string; entryId: string } }) {
  const user = await requireUser();
  const vid = oid(params.id);
  const eid = oid(params.entryId);
  if (!vid || !eid) notFound();

  const d = await db();
  const v = await d.collection("vehicles").findOne({ _id: vid, userId: user._id });
  if (!v) notFound();

  const entry = await d.collection("fuelEntries").findOne({ _id: eid, vehicleId: vid, userId: user._id });
  if (!entry) notFound();

  return (
    <Shell userId={user._id} currentId={params.id}>
      <div className="max-w-lg mx-auto pb-16">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href={`/app/vehicles/${params.id}`}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to vehicle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Edit Fuel Entry
            </h1>
            <p className="text-xs text-slate-500">{v.name}</p>
          </div>
        </div>

        <EditFuelForm
          vehicleId={params.id}
          entry={{
            id: entry._id.toString(),
            entryAt: entry.entryAt.toISOString ? entry.entryAt.toISOString() : new Date(entry.entryAt).toISOString(),
            odometerKm: entry.odometerKm,
            fuelMl: entry.fuelMl,
            totalAmountMinor: entry.totalAmountMinor ?? null,
            fullTank: entry.fullTank,
            notes: entry.notes ?? "",
            missedPreviousFill: entry.missedPreviousFill ?? false,
            odometerReset: entry.odometerReset ?? null,
          }}
        />
      </div>
    </Shell>
  );
}
