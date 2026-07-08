export function BikeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
      <div className="h-56 animate-pulse bg-zinc-900" />

      <div className="space-y-4 p-5">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="h-7 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />

        <div className="border-t border-zinc-800 pt-4">
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-7 w-24 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}