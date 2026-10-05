import { cache } from "react";
import { db } from "./db";

export const getVehiclesList = cache(async (userId: any) => {
  const d = await db();
  return d.collection("vehicles").find({ userId }).sort({ createdAt: 1 }).toArray();
});
