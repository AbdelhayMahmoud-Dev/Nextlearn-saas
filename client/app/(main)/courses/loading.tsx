import { CourseGridSkeleton } from '@/components/course/CourseCardSkeleton';

/** Catalog loading skeleton. */
export default function CoursesLoading(): JSX.Element {
  return (
    <div className="container py-10">
      <div className="mb-8 space-y-2">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-4 w-80 rounded" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">
          <div className="skeleton h-10 w-full rounded" />
          <div className="skeleton h-32 w-full rounded" />
          <div className="skeleton h-24 w-full rounded" />
        </div>
        <CourseGridSkeleton count={9} />
      </div>
    </div>
  );
}
