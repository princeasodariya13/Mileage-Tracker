import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, oid } from "@/lib/db";
import { getVehiclesList } from "@/lib/data";
import Shell from "@/components/Shell";
import AddFuelForm from "@/components/AddFuelForm";

export default async function AddFuel({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const vid = oid(params.id);
  if (!vid) notFound();
  const d = await db();
  const [v, last] = await Promise.all([
    d.collection("vehicles").findOne({ _id: vid, userId: user._id }),
    d.collection("fuelEntries").find({ vehicleId: vid, userId: user._id }).sort({ entryAt: -1, odometerKm: -1 }).limit(1).toArray(),
    getVehiclesList(user._id),
  ]);
  if (!v) notFound();

  return (
    <Shell userId={user._id} currentId={params.id}>
      <div className="max-w-lg mx-auto pb-16">
        {/* Top Header */}
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
              Add Fuel Fill
            </h1>
            <p className="text-xs text-slate-500">{v.name}</p>
          </div>
        </div>

        <AddFuelForm
          vehicleId={params.id}
          lastOdometer={last[0]?.odometerKm ?? v.initialOdometerKm}
        />
      </div>
    </Shell>
  );
}
