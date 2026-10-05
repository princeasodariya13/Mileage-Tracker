// Pure mileage engine (PRD section 10). No DB, no framework.
export type VehicleType = "scooter" | "motorcycle" | "car" | "suv" | "pickup" | "other";

export const BOUNDS: Record<VehicleType, [number, number]> = {
  scooter: [15, 80], motorcycle: [10, 100], car: [5, 40], suv: [4, 30], pickup: [3, 25], other: [2, 100],
};

export type Entry = {
  id: string;
  entryAt: Date;
  odometerKm: number | null;
  fuelMl: number | null;
  totalAmountMinor: number | null;
  fullTank: boolean;
  kind: "refill" | "baseline";
  missedPreviousFill?: boolean;
  odometerReset?: { previousFinalKm: number | null; newStartKm: number } | null;
  acknowledged?: boolean;
};

export type EntryStatus = "baseline" | "closed" | "needs_review" | "in_open_cycle" | "merged" | "unanchored";

export type Segment = {
  startId: string; endId: string; entryIds: string[];
  distanceKm: number; fuelMl: number; costMinor: number | null;
  mileage: number; included: boolean; flag: "implausible_high" | "implausible_low" | null;
  endedAt: Date;
};

export type VehicleInput = {
  vehicleType: VehicleType; initialOdometerKm: number;
  minCycleKm?: number; minCycleFuelMl?: number;
};

export function sortEntries(entries: Entry[]) {
  return [...entries].sort(
    (a, b) => +a.entryAt - +b.entryAt || ((a.odometerKm ?? 0) - (b.odometerKm ?? 0)) || a.id.localeCompare(b.id)
  );
}

export function computeMileage(v: VehicleInput, input: Entry[]) {
  const minKm = v.minCycleKm ?? 20, minMl = v.minCycleFuelMl ?? 500;
  const [lo, hi] = BOUNDS[v.vehicleType];

  // Default petrol price is Rs 110/L.
  // Entries with explicit custom price/litres use their own value.
  // Entries without explicit fuel price strictly use the default Rs 110/L.
  const DEFAULT_PETROL_PRICE_PER_L = 110;

  // Normalize entries: if user only entered spend without explicit fuelMl,
  // calculate fuel volume using standard default Rs 110/L for that entry.
  const normalizedInput = input.map((e) => {
    let fuelMl = e.fuelMl;
    if ((fuelMl == null || fuelMl <= 0) && e.totalAmountMinor != null && e.totalAmountMinor > 0) {
      fuelMl = Math.round(((e.totalAmountMinor / 100) / DEFAULT_PETROL_PRICE_PER_L) * 1000);
    }
    return { ...e, fuelMl };
  });

  const entries = sortEntries(normalizedInput);
  const status: Record<string, EntryStatus> = {};
  const segments: Segment[] = [];

  let offset = 0;
  let anchor: { id: string; tracked: number } | null = null;
  let pendFuel = 0, pendCost = 0, pendCostOk = true, pendIds: string[] = [];
  let lastTracked = v.initialOdometerKm;

  const clear = () => { pendFuel = 0; pendCost = 0; pendCostOk = true; pendIds = []; };

  for (const e of entries) {
    const r = e.odometerReset;
    if (r && r.previousFinalKm != null) offset += r.previousFinalKm - r.newStartKm;
    const hasOdo = e.odometerKm != null && !isNaN(e.odometerKm);
    const tracked = hasOdo ? (e.odometerKm as number) + offset : lastTracked;
    if (hasOdo) lastTracked = tracked;

    const chainBreak = e.kind === "baseline" || e.missedPreviousFill || (r && r.previousFinalKm == null);
    if (chainBreak) {
      anchor = null; clear();
      if (e.fullTank && hasOdo) { anchor = { id: e.id, tracked }; status[e.id] = "baseline"; }
      else status[e.id] = "unanchored";
      continue;
    }
    const fuel = e.fuelMl ?? 0;
    if (fuel <= 0 || !hasOdo) {
      status[e.id] = "unanchored";
      continue;
    }

    if (e.fullTank) {
      if (!anchor) { anchor = { id: e.id, tracked }; clear(); status[e.id] = "baseline"; continue; }
      const distanceKm = tracked - anchor.tracked;
      const fuelMl = pendFuel + fuel;
      const costOk = pendCostOk && e.totalAmountMinor != null;
      const costMinor = costOk ? pendCost + (e.totalAmountMinor as number) : null;
      if (distanceKm < minKm || fuelMl < minMl) {
        pendFuel = fuelMl; pendCost += e.totalAmountMinor ?? 0;
        if (e.totalAmountMinor == null) pendCostOk = false;
        pendIds.push(e.id); status[e.id] = "merged";
        continue;
      }
      const mileage = distanceKm / (fuelMl / 1000);
      const flag = mileage > hi ? "implausible_high" : mileage < lo ? "implausible_low" : null;
      const isAcked = Boolean(e.acknowledged);
      const included = !flag || isAcked;
      const entryIds = [...pendIds, e.id];
      segments.push({ startId: anchor.id, endId: e.id, entryIds, distanceKm, fuelMl, costMinor, mileage, included, flag, endedAt: e.entryAt });
      for (const id of pendIds) status[id] = flag && !isAcked ? "needs_review" : "closed";
      status[e.id] = flag && !isAcked ? "needs_review" : "closed";
      anchor = { id: e.id, tracked }; clear();
    } else if (anchor) {
      pendFuel += fuel; pendCost += e.totalAmountMinor ?? 0;
      if (e.totalAmountMinor == null) pendCostOk = false;
      pendIds.push(e.id); status[e.id] = "in_open_cycle";
    } else {
      status[e.id] = "unanchored";
    }
  }

  // aggregates over included segments only; ratio of sums, never a mean of ratios
  const inc = segments.filter((s) => s.included);
  const sumKm = (a: Segment[]) => a.reduce((t, s) => t + s.distanceKm, 0);
  const sumL = (a: Segment[]) => a.reduce((t, s) => t + s.fuelMl, 0) / 1000;
  const avg = inc.length ? sumKm(inc) / sumL(inc) : null;
  const recent = inc.slice(-3);
  const priced = inc.filter((s) => s.costMinor != null);
  const refills = entries.filter((e) => e.kind === "refill");
  const spendRows = refills.filter((e) => e.totalAmountMinor != null);
  const ms = inc.map((s) => s.mileage);

  const confidence = inc.length === 0 ? "none" : inc.length === 1 ? "early" : inc.length < 5 ? "building" : "reliable";
  const totalRefillFuelMl = refills.reduce((t, e) => t + (e.fuelMl ?? 0), 0);
  const totalSpendMinor = spendRows.reduce((t, e) => t + (e.totalAmountMinor as number), 0);

  return {
    segments, status,
    includedCount: inc.length,
    needsReviewCount: segments.length - inc.length,
    confidence,
    averageKmpl: avg,
    lastKmpl: inc.length ? inc[inc.length - 1].mileage : null,
    recentKmpl: recent.length ? sumKm(recent) / sumL(recent) : null,
    bestKmpl: inc.length >= 2 ? Math.max(...ms) : null,
    worstKmpl: inc.length >= 2 ? Math.min(...ms) : null,
    verifiedKm: sumKm(inc),
    verifiedL: sumL(inc),
    costPerKmMinor: priced.length ? priced.reduce((t, s) => t + (s.costMinor as number), 0) / sumKm(priced) : null,
    costCycles: priced.length,
    totalFuelL: totalRefillFuelMl / 1000,
    totalSpendMinor,
    avgPricePerLMinor: totalRefillFuelMl > 0 && totalSpendMinor > 0
      ? Math.round(totalSpendMinor / (totalRefillFuelMl / 1000))
      : 11000,
    trackedKm: entries.length ? lastTracked - v.initialOdometerKm : 0,
    latestOdometerKm: lastTracked,
    anchorOdometerKm: anchor ? (anchor as { tracked: number }).tracked - offset : null,
    open: anchor ? { distanceKm: lastTracked - anchor.tracked, fuelMl: pendFuel } : null,
  };
}
