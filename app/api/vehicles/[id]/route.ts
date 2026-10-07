import { NextResponse } from "next/server";
import { db, oid } from "@/lib/db";
import { getUser, sameOriginOk } from "@/lib/auth";

const TYPES = ["scooter", "motorcycle", "car", "suv", "pickup", "other"];

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const vid = oid(params.id);
  if (!vid) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const d = await db();
  const v = await d.collection("vehicles").findOne({ _id: vid, userId: user._id });
  if (!v) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({
    id: v._id.toString(),
    name: v.name,
    vehicleType: v.vehicleType,
    fuelType: v.fuelType,
    registrationNumber: v.registrationNumber,
    tankCapacityL: v.tankCapacityMl ? v.tankCapacityMl / 1000 : null,
    initialOdometerKm: v.initialOdometerKm,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!sameOriginOk()) return NextResponse.json({ error: "Bad request origin." }, { status: 403 });

  const vid = oid(params.id);
  if (!vid) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const d = await db();
  const existing = await d.collection("vehicles").findOne({ _id: vid, userId: user._id });
  if (!existing) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const updateDoc: Record<string, any> = {
    updatedAt: new Date(),
  };

  if ("name" in b) {
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Vehicle name must be between 1 and 60 characters." }, { status: 422 });
    }
    updateDoc.name = name;
  }

  if ("vehicleType" in b) {
    if (!TYPES.includes(b.vehicleType)) {
      return NextResponse.json({ error: "Invalid vehicle type." }, { status: 422 });
    }
    updateDoc.vehicleType = b.vehicleType;
  }

  if ("fuelType" in b) {
    if (!["petrol", "diesel"].includes(b.fuelType)) {
      return NextResponse.json({ error: "Invalid fuel type (petrol or diesel)." }, { status: 422 });
    }
    updateDoc.fuelType = b.fuelType;
  }

  if ("registrationNumber" in b) {
    updateDoc.registrationNumber =
      typeof b.registrationNumber === "string" && b.registrationNumber.trim()
        ? b.registrationNumber.toUpperCase().replace(/[\s-]/g, "").slice(0, 15)
        : null;
  }

  if ("tankCapacityL" in b) {
    const tank = b.tankCapacityL ? Math.round(Number(b.tankCapacityL) * 1000) : null;
    if (tank !== null && (tank < 1000 || tank > 200000)) {
      return NextResponse.json({ error: "Tank capacity must be between 1 and 200 litres." }, { status: 422 });
    }
    updateDoc.tankCapacityMl = tank;
  }

  if ("initialOdometerKm" in b) {
    const odo = b.initialOdometerKm !== "" && b.initialOdometerKm != null ? Number(b.initialOdometerKm) : null;
    if (odo != null && (!Number.isInteger(odo) || odo < 0 || odo > 9999999)) {
      return NextResponse.json({ error: "Enter the initial odometer as a whole number of km." }, { status: 422 });
    }
    if (odo != null) {
      updateDoc.initialOdometerKm = odo;
    }
  }

  await d.collection("vehicles").updateOne({ _id: vid, userId: user._id }, { $set: updateDoc });

  return NextResponse.json({ ok: true, message: "Vehicle details updated successfully." });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!sameOriginOk()) return NextResponse.json({ error: "Bad request origin." }, { status: 403 });

  const vid = oid(params.id);
  if (!vid) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const d = await db();
  const r = await d.collection("vehicles").deleteOne({ _id: vid, userId: user._id });
  if (!r.deletedCount) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });

  // Cascade delete all associated fuel entries for this vehicle
  await d.collection("fuelEntries").deleteMany({ vehicleId: vid, userId: user._id });

  return NextResponse.json({ ok: true, message: "Vehicle deleted successfully." });
}
