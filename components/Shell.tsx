import { db } from "@/lib/db";
import Header from "./Header";

export default async function Shell({ userId, currentId, children }: { userId: any; currentId?: string; children: React.ReactNode }) {
  const list = await (await db()).collection("vehicles").find({ userId }).sort({ createdAt: 1 }).toArray();
  return (
    <div className="page-wrapper min-h-dvh">
      <Header vehicles={list.map((v) => ({ id: v._id.toString(), name: v.name }))} currentId={currentId} />
      <main className="page-inner animate-fade-up relative" style={{ zIndex: 1 }}>{children}</main>
    </div>
  );
}
