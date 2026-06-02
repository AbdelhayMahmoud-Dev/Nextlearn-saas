/**
 * Suspense boundary shown during navigation between lessons.
 * Mirrors the PlayerSkeleton rendered by the page itself while data loads.
 */
export default function LessonLoading(): JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <div className="skeleton h-14 border-b" />
      <div className="flex flex-1">
        <div className="flex-1">
          <div className="skeleton aspect-video w-full" />
        </div>
        <div className="hidden w-80 space-y-3 border-l p-4 lg:block">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
