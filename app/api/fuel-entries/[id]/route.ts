import { NextResponse } from "next/server";
import { db, oid } from "@/lib/db";
import { getUser, sameOriginOk } from "@/lib/auth";
import { computeMileage, sortEntries } from "@/lib/mileage";
import { toEntry } from "@/lib/entries";
import { inr, kmpl2, km } from "@/lib/format";

const fail = (message: string, status = 422) => NextResponse.json({ error: message }, { status });

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return fail("Please log in.", 401);
  if (!sameOriginOk()) return fail("Bad request origin.", 403);
  const id = oid(params.id);
  if (!id) return fail("Not found.", 404);
  const r = await (await db()).collection("fuelEntries").deleteOne({ _id: id, userId: user._id });
  return r.deletedCount ? NextResponse.json({ ok: true }) : fail("Not found.", 404);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return fail("Please log in.", 401);
  if (!sameOriginOk()) return fail("Bad request origin.", 403);
  const id = oid(params.id);
  if (!id) return fail("Not found.", 404);

  const d = await db();
  const existingDoc = await d.collection("fuelEntries").findOne({ _id: id, userId: user._id });
  if (!existingDoc) return fail("Not found.", 404);

  const vehicle = await d.collection("vehicles").findOne({ _id: existingDoc.vehicleId, userId: user._id });
  if (!vehicle) return fail("Not found.", 404);

  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request.", 400);

  // Quick acknowledgment payload check
  if (Object.keys(b).length === 1 && typeof b.acknowledged === "boolean") {
    await d.collection("fuelEntries").updateOne({ _id: id, userId: user._id }, { $set: { acknowledged: b.acknowledged } });
    return NextResponse.json({ ok: true, message: b.acknowledged ? "Cycle acknowledged." : "Acknowledgment removed." });
  }

  // Full edit payload validation
  const odometerKm = b.odometerKm !== "" && b.odometerKm != null ? Number(b.odometerKm) : null;
  let fuelMl = b.litres !== "" && b.litres != null ? Math.round(Number(b.litres) * 1000) : null;
  const entryAt = b.entryAt ? new Date(b.entryAt) : existingDoc.entryAt;

  if (odometerKm != null && (!Number.isInteger(odometerKm) || odometerKm < 0 || odometerKm > 9999999)) return fail("Enter the odometer as a whole number of km.");
  if (fuelMl != null && (isNaN(fuelMl) || fuelMl <= 0 || fuelMl > 200000)) return fail("Please enter a valid fuel quantity in litres.");
  if (isNaN(+entryAt) || +entryAt > Date.now() + 864e5) return fail("That date is in the future.");

  let totalAmountMinor: number | null = existingDoc.totalAmountMinor;
  if ("totalAmount" in b || "pricePerLitre" in b) {
    if (b.totalAmount !== "" && b.totalAmount != null) totalAmountMinor = Math.round(Number(b.totalAmount) * 100);
    else if (b.pricePerLitre !== "" && b.pricePerLitre != null && fuelMl != null) totalAmountMinor = Math.round((fuelMl * Number(b.pricePerLitre) * 100) / 1000);
  }
  if (totalAmountMinor == null || isNaN(totalAmountMinor) || totalAmountMinor <= 0 || totalAmountMinor > 1e8) return fail("Please enter the total fuel amount (price paid).");

  if (fuelMl == null && totalAmountMinor != null) {
    if (b.pricePerLitre !== "" && b.pricePerLitre != null && Number(b.pricePerLitre) > 0) {
      fuelMl = Math.round(((totalAmountMinor / 100) / Number(b.pricePerLitre)) * 1000);
    } else {
      const defaultPetrolPrice = 102;
      fuelMl = Math.round(((totalAmountMinor / 100) / defaultPetrolPrice) * 1000);
    }
  }

  let odometerReset = existingDoc.odometerReset ?? null;
  if ("odometerReset" in b) {
    if (b.odometerReset) {
      const prev = b.odometerReset.previousFinalKm;
      odometerReset = {
        previousFinalKm: prev === "" || prev == null ? null : Number(prev),
        newStartKm: Number(b.odometerReset.newStartKm) || 0,
      };
    } else {
      odometerReset = null;
    }
  }

  // Neighbour check on tracked odometer (excluding this entry, only if odometerKm provided)
  const raw = await d.collection("fuelEntries").find({ vehicleId: existingDoc.vehicleId, userId: user._id }).toArray();
  const existingOthers = sortEntries(raw.filter((e) => e._id.toString() !== id.toString()).map(toEntry));
  const before = existingOthers.filter((e) => +e.entryAt <= +entryAt && e.odometerKm != null);
  const after = existingOthers.filter((e) => +e.entryAt > +entryAt && e.odometerKm != null);

  if (odometerKm != null && !odometerReset) {
    const prevKm = before.length ? (before[before.length - 1].odometerKm as number) : (vehicle.initialOdometerKm ?? 0);
    if (odometerKm < prevKm) return fail(`Odometer must be at least ${km(prevKm)} (your previous reading). If the odometer was reset, use "Odometer was reset".`);
    if (after.length && odometerKm > (after[0].odometerKm as number)) return fail(`A later entry is at ${km(after[0].odometerKm)}, so this must be ${km(after[0].odometerKm)} or less.`);
  }

  const updateFields: Record<string, any> = {
    odometerKm, fuelMl, entryAt, totalAmountMinor, odometerReset,
    fullTank: b.fullTank !== undefined ? b.fullTank !== false : existingDoc.fullTank,
    missedPreviousFill: b.missedPreviousFill !== undefined ? b.missedPreviousFill === true : existingDoc.missedPreviousFill,
    notes: typeof b.notes === "string" ? b.notes.slice(0, 500) : (existingDoc.notes ?? ""),
    kind: "refill",
    updatedAt: new Date(),
  };

  if ("acknowledged" in b) updateFields.acknowledged = Boolean(b.acknowledged);

  await d.collection("fuelEntries").updateOne({ _id: id, userId: user._id }, { $set: updateFields });

  // Compute updated mileage response message
  const updatedRaw = await d.collection("fuelEntries").find({ vehicleId: existingDoc.vehicleId, userId: user._id }).toArray();
  const allEntries = updatedRaw.map(toEntry);
  const res = computeMileage(vehicle as any, allEntries);
  const st = res.status[id.toString()];
  const seg = res.segments.find((s) => s.endId === id.toString());

  let message = "Entry updated.";
  if (st === "baseline") message = `Starting point set at ${km(odometerKm)}.`;
  else if (seg && st === "closed") message = `Updated: ${km(seg.distanceKm)} on ${(seg.fuelMl / 1000).toFixed(2)} L = ${kmpl2(seg.mileage)}. Average is now ${res.averageKmpl!.toFixed(1)} km/L over ${res.includedCount} fill${res.includedCount === 1 ? "" : "s"}.`;
  else if (seg && st === "needs_review") message = `Updated. This works out to ${seg.mileage.toFixed(1)} km/L, which looks off. Marked Needs review.`;
  else if (st === "in_open_cycle") message = `Updated entry in current cycle (${km(res.open?.distanceKm ?? 0)} so far).`;

  return NextResponse.json({ ok: true, message }, { status: 200 });
}
