/**
 * Suspense boundary shown during navigation to /my-courses.
 */
export default function MyCoursesLoading(): JSX.Element {
  return (
    <div className="container py-10">
      <div className="skeleton mb-6 h-8 w-48 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
