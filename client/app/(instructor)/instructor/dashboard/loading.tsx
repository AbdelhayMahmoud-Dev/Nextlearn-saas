export default function InstructorDashboardLoading(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64 rounded" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-60 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
}
