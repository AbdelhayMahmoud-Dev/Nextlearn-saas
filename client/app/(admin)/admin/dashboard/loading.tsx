/** Admin dashboard loading skeleton. */
export default function AdminDashboardLoading(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-56 rounded" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-[340px] w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </div>
  );
}
