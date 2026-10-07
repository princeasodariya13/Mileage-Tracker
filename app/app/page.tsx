import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getVehiclesList } from "@/lib/data";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import Shell from "@/components/Shell";
import GarageDashboard, { GarageActivity } from "@/components/GarageDashboard";
import { VehicleCardData } from "@/components/VehiclesList";

export default async function AppHome() {
  const user = await requireUser();
  const d = await db();

  const [vehiclesRaw, fuelEntriesRaw] = await Promise.all([
    getVehiclesList(user._id),
    d.collection("fuelEntries").find({ userId: user._id }).toArray(),
  ]);

  let overallSpendMinor = 0;
  let overallTrackedKm = 0;
  let overallFuelMl = 0;
  let fleetWeightedKm = 0;
  let fleetWeightedFuelMl = 0;

  const vehicleNameMap = new Map<string, { name: string; type: string }>();
  for (const v of vehiclesRaw) {
    vehicleNameMap.set(v._id.toString(), { name: v.name, type: v.vehicleType || "motorcycle" });
  }

  const allRecentEntries: GarageActivity[] = [];

  const vehicleCards: VehicleCardData[] = vehiclesRaw.map((v) => {
    const vEntriesRaw = fuelEntriesRaw.filter((e) => e.vehicleId.toString() === v._id.toString());
    const vEntries = sortEntries(vEntriesRaw.map(toEntry));
    const r = computeMileage(v as any, vEntries);

    overallSpendMinor += r.totalSpendMinor;
    overallTrackedKm += r.trackedKm;

    for (const e of vEntries) {
      if (e.fuelMl) overallFuelMl += e.fuelMl;
    }

    if (r.averageKmpl != null && r.includedCount > 0) {
      for (const seg of r.segments) {
        if (seg.included) {
          fleetWeightedKm += seg.distanceKm;
          fleetWeightedFuelMl += seg.fuelMl;
        }
      }
    }

    const lastEntry = vEntries.length ? vEntries[vEntries.length - 1] : null;

    // Collect recent activity
    const segByEnd = new Map(r.segments.map((s) => [s.endId, s]));
    for (const e of vEntries) {
      const s = segByEnd.get(e.id);
      allRecentEntries.push({
        id: e.id,
        vehicleId: v._id.toString(),
        vehicleName: v.name,
        vehicleType: v.vehicleType || "vehicle",
        entryAt: e.entryAt.toISOString(),
        totalAmountMinor: e.totalAmountMinor,
        fuelMl: e.fuelMl,
        odometerKm: e.odometerKm,
        mileage: s?.mileage ?? null,
      });
    }

    return {
      id: v._id.toString(),
      name: v.name,
      vehicleType: v.vehicleType || "motorcycle",
      fuelType: v.fuelType || "petrol",
      registrationNumber: v.registrationNumber || undefined,
      tankCapacityL: v.tankCapacityMl ? v.tankCapacityMl / 1000 : null,
      initialOdometerKm: v.initialOdometerKm || 0,
      fillCount: vEntries.length,
      totalSpendMinor: r.totalSpendMinor,
      averageKmpl: r.averageKmpl,
      lastOdometerKm: r.latestOdometerKm,
      lastFillDate: lastEntry ? new Date(lastEntry.entryAt).toISOString() : null,
    };
  });

  // Sort recent entries by date descending, limit to 10
  allRecentEntries.sort((a, b) => new Date(b.entryAt).getTime() - new Date(a.entryAt).getTime());
  const recentActivity = allRecentEntries.slice(0, 10);

  const fleetAverageKmpl =
    fleetWeightedKm > 0 && fleetWeightedFuelMl > 0
      ? fleetWeightedKm / (fleetWeightedFuelMl / 1000)
      : null;

  return (
    <Shell userId={user._id}>
      <GarageDashboard
        data={{
          totalSpendMinor: overallSpendMinor,
          totalTrackedKm: overallTrackedKm,
          totalFuelLitres: overallFuelMl / 1000,
          fleetAverageKmpl,
          vehiclesCount: vehiclesRaw.length,
          totalFillsCount: fuelEntriesRaw.length,
          vehicleCards,
          recentActivity,
        }}
      />
    </Shell>
  );
}

