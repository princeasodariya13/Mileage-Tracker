"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client";

export default function DeleteButton({ id, isFull }: { id: string; isFull: boolean }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    const { ok, data } = await post(`/api/fuel-entries/${id}`, undefined, "DELETE");
    if (ok) {
      setShowModal(false);
      setIsDeleting(false);
      router.refresh();
    } else {
      setIsDeleting(false);
      setError(data?.error || "Could not delete entry.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        title="Delete fill"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>

      {/* Delete Confirmation Modal rendered via Portal */}
      {mounted && showModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-slate-900"
          onClick={() => !isDeleting && setShowModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Fuel Entry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Are you sure you want to delete this fill?</p>
              </div>
            </div>

            {/* Warning Message Box */}
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isFull
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-slate-50 border-slate-100 text-slate-600"
            }`}>
              {isFull
                ? "⚠️ Deleting a full-tank fill merges its surrounding fuel cycles. Its fuel volume and spend will no longer count towards average calculations."
                : "This fuel fill entry will be permanently removed from your vehicle's history."}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-center border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-center text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Fill"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
