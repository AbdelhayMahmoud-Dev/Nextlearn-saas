/** Skeleton placeholder matching CourseCard's layout. */
export function CourseCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="skeleton aspect-video" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-6 w-16 rounded" />
      </div>
    </div>
  );
}

/** A responsive grid of skeleton cards for the catalog loading state. */
export function CourseGridSkeleton({ count = 12 }: { count?: number }): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
