import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser, sameOriginOk } from "@/lib/auth";

const TYPES = ["scooter", "motorcycle", "car", "suv", "pickup", "other"];

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!sameOriginOk()) return NextResponse.json({ error: "Bad request origin." }, { status: 403 });

  const b = await req.json().catch(() => null);
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const odo = b?.initialOdometerKm;
  if (!name || name.length > 60) return NextResponse.json({ error: "Give the vehicle a name (up to 60 characters)." }, { status: 422 });
  if (!TYPES.includes(b?.vehicleType)) return NextResponse.json({ error: "Pick a vehicle type." }, { status: 422 });
  if (!["petrol", "diesel"].includes(b?.fuelType)) return NextResponse.json({ error: "Pick petrol or diesel." }, { status: 422 });
  if (!Number.isInteger(odo) || odo < 0 || odo > 9999999) return NextResponse.json({ error: "Enter the odometer as a whole number of km." }, { status: 422 });
  const tank = b?.tankCapacityL ? Math.round(Number(b.tankCapacityL) * 1000) : null;
  if (tank !== null && (tank < 1000 || tank > 200000)) return NextResponse.json({ error: "Tank capacity must be between 1 and 200 litres." }, { status: 422 });

  const d = await db();
  if ((await d.collection("vehicles").countDocuments({ userId: user._id })) >= 20)
    return NextResponse.json({ error: "You can track up to 20 vehicles." }, { status: 422 });

  const now = new Date();
  const r = await d.collection("vehicles").insertOne({
    userId: user._id, name, vehicleType: b.vehicleType, fuelType: b.fuelType,
    registrationNumber: typeof b.registrationNumber === "string" && b.registrationNumber.trim()
      ? b.registrationNumber.toUpperCase().replace(/[\s-]/g, "").slice(0, 15) : null,
    tankCapacityMl: tank, initialOdometerKm: odo, initialOdometerAt: now, createdAt: now,
  });
  if (b.tankIsFullNow === true) {
    await d.collection("fuelEntries").insertOne({
      vehicleId: r.insertedId, userId: user._id, kind: "baseline", entryAt: now, odometerKm: odo,
      fuelMl: null, totalAmountMinor: null, fullTank: true, createdAt: now,
    });
  }
  return NextResponse.json({ id: r.insertedId.toString() }, { status: 201 });
}
