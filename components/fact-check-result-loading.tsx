"use client"

export function FactCheckResultLoading() {
  return (
    <div className="p-4 rounded-lg border border-zinc-700">
      <div className="flex items-start justify-between mb-3">
        <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="space-y-2 mb-3">
        <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full bg-zinc-800/50 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-zinc-800/50 rounded animate-pulse" />
        <div className="h-3 w-4/6 bg-zinc-800/50 rounded animate-pulse" />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
      </div>
    </div>
  )
}
