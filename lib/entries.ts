import type { Entry } from "./mileage";

export function toEntry(x: any): Entry {
  return {
    id: x._id.toString(), entryAt: x.entryAt, odometerKm: x.odometerKm ?? null, fuelMl: x.fuelMl ?? null,
    totalAmountMinor: x.totalAmountMinor ?? null, fullTank: Boolean(x.fullTank), kind: x.kind,
    missedPreviousFill: Boolean(x.missedPreviousFill), odometerReset: x.odometerReset ?? null,
    acknowledged: Boolean(x.acknowledged),
  };
}

