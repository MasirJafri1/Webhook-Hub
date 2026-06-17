import { Loader2 } from "lucide-react";

export function Spinner({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 gap-3.5 w-full min-h-[300px]">
      <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 shadow-md">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-zinc-400 animate-pulse tracking-wide font-sans">{message}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 flex flex-col gap-4 bg-zinc-900/20 border border-zinc-800/60 rounded-2xl animate-pulse shadow-sm h-36">
      <div className="flex justify-between items-center">
        <div className="h-2.5 w-24 bg-zinc-800/80 rounded" />
        <div className="h-8.5 w-8.5 bg-zinc-800/80 rounded-xl" />
      </div>
      <div className="h-8 w-16 bg-zinc-800/80 rounded mt-auto" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full border border-zinc-800/60 bg-zinc-900/10 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden animate-pulse">
      <div className="border-b border-zinc-800/60 bg-zinc-900/40 p-4.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-zinc-800/80 rounded flex-grow max-w-[120px]" />
        ))}
      </div>
      <div className="divide-y divide-zinc-800/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4.5 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className={`h-2.5 bg-zinc-800/60 rounded flex-grow ${
                  j === 0 ? "max-w-[160px]" : "max-w-[100px]"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Title block */}
      <div className="flex flex-col gap-2 pb-5 border-b border-zinc-800/60 animate-pulse">
        <div className="h-6 w-48 bg-zinc-800 rounded" />
        <div className="h-3 w-80 bg-zinc-800/60 rounded mt-1" />
      </div>

      {/* Cards block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Table block */}
      <TableSkeleton />
    </div>
  );
}
