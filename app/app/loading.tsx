export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 bg-slate-200 rounded-xl w-48"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-28"></div>
      </div>

      {/* Summary card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-20"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-20"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-20"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-20"></div>
            <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
          </div>
        </div>
      </div>

      {/* List items skeleton */}
      <div className="space-y-3">
        <div className="h-20 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs"></div>
        <div className="h-20 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs"></div>
        <div className="h-20 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs"></div>
      </div>
    </div>
  );
}
