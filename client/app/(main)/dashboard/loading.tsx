/**
 * Suspense boundary shown during navigation to /dashboard.
 * Matches the skeleton already rendered by the page when `isLoading` is true.
 */
export default function DashboardLoading(): JSX.Element {
  return (
    <div className="container space-y-8 py-10">
      <div className="skeleton h-9 w-64 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-64 w-full rounded-xl" />
    </div>
  );
}
