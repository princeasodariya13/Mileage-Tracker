import { NextResponse } from "next/server";
import { db, oid } from "@/lib/db";
import { getUser, sameOriginOk } from "@/lib/auth";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import { inr, kmpl2, km } from "@/lib/format";

const fail = (message: string, status = 422) => NextResponse.json({ error: message }, { status });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return fail("Please log in.", 401);
  if (!sameOriginOk()) return fail("Bad request origin.", 403);
  const vid = oid(params.id);
  if (!vid) return fail("Not found.", 404);

  const d = await db();
  const vehicle = await d.collection("vehicles").findOne({ _id: vid, userId: user._id });
  if (!vehicle) return fail("Not found.", 404);

  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request.", 400);

  const entryAt = new Date(b.entryAt ?? Date.now());
  if (isNaN(+entryAt) || +entryAt > Date.now() + 864e5) return fail("Please select a valid date & time.");

  // Total amount paid (Required)
  let totalAmountMinor: number | null = null;
  if (b.totalAmount !== "" && b.totalAmount != null) {
    totalAmountMinor = Math.round(Number(b.totalAmount) * 100);
  } else if (b.pricePerLitre !== "" && b.pricePerLitre != null && b.litres !== "" && b.litres != null) {
    totalAmountMinor = Math.round(Number(b.litres) * Number(b.pricePerLitre) * 100);
  }

  if (totalAmountMinor == null || isNaN(totalAmountMinor) || totalAmountMinor <= 0 || totalAmountMinor > 1e8) {
    return fail("Please enter the total fuel amount (price paid).");
  }

  // Odometer (Optional)
  let odometerKm: number | null = null;
  if (b.odometerKm !== "" && b.odometerKm != null) {
    odometerKm = Number(b.odometerKm);
    if (!Number.isInteger(odometerKm) || odometerKm < 0 || odometerKm > 9999999) {
      return fail("Enter the odometer as a whole number of km.");
    }
  }

  // Neighbour check & calculate average petrol price from existing entries
  const raw = await d.collection("fuelEntries").find({ vehicleId: vid, userId: user._id }).toArray();
  const existing = sortEntries(raw.map(toEntry));

  // Litres & Fuel Volume calculation
  let fuelMl: number | null = null;
  if (b.litres !== "" && b.litres != null) {
    fuelMl = Math.round(Number(b.litres) * 1000);
    if (isNaN(fuelMl) || fuelMl <= 0 || fuelMl > 200000) {
      return fail("Please enter a valid fuel quantity in litres.");
    }
  } else if (b.pricePerLitre !== "" && b.pricePerLitre != null && Number(b.pricePerLitre) > 0) {
    const price = Number(b.pricePerLitre);
    fuelMl = Math.round(((totalAmountMinor / 100) / price) * 1000);
  } else {
    // Default petrol price is Rs 110/L for entries where no custom price was entered
    const defaultPetrolPrice = 110;
    fuelMl = Math.round(((totalAmountMinor / 100) / defaultPetrolPrice) * 1000);
  }

  let odometerReset = null;
  if (b.odometerReset) {
    const prev = b.odometerReset.previousFinalKm;
    odometerReset = {
      previousFinalKm: prev === "" || prev == null ? null : Number(prev),
      newStartKm: Number(b.odometerReset.newStartKm) || 0,
    };
  }
  const before = existing.filter((e) => +e.entryAt <= +entryAt && e.odometerKm != null);
  const after = existing.filter((e) => +e.entryAt > +entryAt && e.odometerKm != null);
  if (odometerKm != null && !odometerReset) {
    const prevKm = before.length ? (before[before.length - 1].odometerKm as number) : vehicle.initialOdometerKm;
    if (odometerKm < prevKm) return fail(`Odometer must be at least ${km(prevKm)} (your previous reading). If the odometer was reset, use "Odometer was reset".`);
    if (after.length && odometerKm > (after[0].odometerKm as number)) return fail(`A later entry is at ${km(after[0].odometerKm)}, so this must be ${km(after[0].odometerKm)} or less.`);
  }

  const now = new Date();
  const doc = {
    vehicleId: vid, userId: user._id, kind: "refill", entryAt, odometerKm, fuelMl, totalAmountMinor,
    fullTank: b.fullTank !== false, missedPreviousFill: b.missedPreviousFill === true, odometerReset,
    notes: typeof b.notes === "string" ? b.notes.slice(0, 500) : "", createdAt: now,
  };
  const r = await d.collection("fuelEntries").insertOne(doc);

  // immediate feedback, computed from the rebuilt data
  const all = [...raw, { ...doc, _id: r.insertedId }].map(toEntry);
  const res = computeMileage(vehicle as any, all);
  const id = r.insertedId.toString();
  const st = res.status[id];
  const seg = res.segments.find((s) => s.endId === id);
  let message = `Saved fill of ${inr(totalAmountMinor)}.`;
  if (st === "baseline" && odometerKm != null) message = `Starting point set at ${km(odometerKm)}. Mileage appears after your next full-tank fill.`;
  else if (seg && st === "closed") message = `${km(seg.distanceKm)} on ${(seg.fuelMl / 1000).toFixed(2)} L = ${kmpl2(seg.mileage)}. Average is now ${res.averageKmpl!.toFixed(1)} km/L over ${res.includedCount} fill${res.includedCount === 1 ? "" : "s"}.${totalAmountMinor != null ? " This fill: " + inr(totalAmountMinor) + "." : ""}`;
  else if (seg && st === "needs_review") message = `This works out to ${seg.mileage.toFixed(1)} km/L, which looks off. Did you miss logging a fill? It is left out of your average until you fix it.`;
  else if (st === "in_open_cycle") message = `Added to your current cycle (${km(res.open?.distanceKm ?? 0)} so far). Mileage is worked out when you next fill the tank.`;
  else if (st === "merged") message = "Too close to the last full fill, so it is counted in the next cycle.";
  else if (st === "unanchored") message = `Saved fill of ${inr(totalAmountMinor)}.`;
  return NextResponse.json({ id, message }, { status: 201 });
}
