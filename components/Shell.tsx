import { getVehiclesList } from "@/lib/data";
import Header from "./Header";

export default async function Shell({ userId, currentId, children }: { userId: any; currentId?: string; children: React.ReactNode }) {
  const list = await getVehiclesList(userId);
  return (
    <div className="page-wrapper min-h-dvh">
      <Header vehicles={list.map((v) => ({ id: v._id.toString(), name: v.name }))} currentId={currentId} />
      <main className="page-inner animate-fade-up relative" style={{ zIndex: 1 }}>{children}</main>
    </div>
  );
}
