import Link from "next/link";
import { requireUser } from "@/lib/auth";
import Shell from "@/components/Shell";
import NewVehicleForm from "@/components/NewVehicleForm";

export default async function NewVehicle() {
  const user = await requireUser();
  return (
    <Shell userId={user._id}>
      <div className="max-w-lg mx-auto pb-16">
        {/* Top Header Bar (Clean Light Theme) */}
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/app"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Garage"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Add New Vehicle
            </h1>
            <p className="text-xs text-slate-500">Add a bike, scooter, or car to track mileage</p>
          </div>
        </div>

        <NewVehicleForm />
      </div>
    </Shell>
  );
}
