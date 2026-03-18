// Loading skeletons for the reader homepage

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/5 ${className ?? ""}`}
    />
  );
}

// ── Comic card skeleton ───────────────────────────────────────
export function ComicCardSkeleton() {
  return (
    <div className="w-[140px] shrink-0 sm:w-[160px]">
      <Shimmer className="aspect-[3/4] w-full rounded-lg" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <Shimmer className="h-3.5 w-full" />
        <Shimmer className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// ── Comic row skeleton ────────────────────────────────────────
export function ComicRowSkeleton() {
  return (
    <section className="space-y-3">
      <Shimmer className="h-5 w-36" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <ComicCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// ── Hero skeleton ─────────────────────────────────────────────
export function HeroSkeleton() {
  return (
    <div className="relative h-[55vh] min-h-[380px] w-full overflow-hidden bg-card md:h-[65vh]">
      {/* bg shimmer */}
      <Shimmer className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
        <div className="mx-auto max-w-7xl">
          {/* tabs */}
          <div className="mb-6 flex gap-3">
            <Shimmer className="h-8 w-24 rounded-full" />
            <Shimmer className="h-8 w-32 rounded-full" />
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* cover */}
            <Shimmer className="h-40 w-28 shrink-0 rounded-xl md:h-52 md:w-36" />
            {/* info */}
            <div className="space-y-3">
              <Shimmer className="h-7 w-64 md:w-96" />
              <Shimmer className="h-4 w-40" />
              <Shimmer className="h-12 w-72 md:w-[420px]" />
              <div className="flex gap-3">
                <Shimmer className="h-10 w-28 rounded-lg" />
                <Shimmer className="h-10 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
