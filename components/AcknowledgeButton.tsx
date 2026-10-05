"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";

export default function AcknowledgeButton({ id, currentAck = false }: { id: string; currentAck?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const { ok, data } = await post(`/api/fuel-entries/${id}`, { acknowledged: !currentAck }, "PATCH");
    setBusy(false);
    if (ok) router.refresh();
    else alert(data.error || "Could not update.");
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={currentAck ? "Remove acknowledgment" : "Acknowledge — include in average"}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
      style={{
        background: currentAck ? "rgba(245,158,11,0.1)" : "rgba(124,58,237,0.08)",
        color: currentAck ? "var(--amber)" : "var(--accent-light)",
        border: "none",
        cursor: busy ? "not-allowed" : "pointer",
        opacity: busy ? 0.5 : 1,
      }}
    >
      {currentAck ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
