import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { serverGet } from '@/lib/server-api';
import type { ApiResponse, ICourse, PaginatedResponse } from '@/types';
import { CourseGrid } from '@/components/course/CourseGrid';
import { CourseFilters } from '@/components/course/CourseFilters';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';

export const metadata: Metadata = {
  title: 'Courses',
  description: 'Browse and search the full course catalog.',
};

type SearchParams = Record<string, string | string[] | undefined>;
type Category = { name: string; count: number };

const LIMIT = 12;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string' && value) qs.set(key, value);
  }
  qs.set('limit', String(LIMIT));

  let courses: ICourse[] = [];
  let total = 0;
  let page = 1;
  let totalPages = 1;
  let categories: Category[] = [];
  let failed = false;

  try {
    const [coursesRes, categoriesRes] = await Promise.all([
      serverGet<PaginatedResponse<ICourse>>(`/courses?${qs.toString()}`),
      serverGet<ApiResponse<Category[]>>(`/courses/categories`),
    ]);
    courses = coursesRes.data;
    total = coursesRes.meta.total;
    page = coursesRes.meta.page;
    totalPages = coursesRes.meta.totalPages;
    categories = categoriesRes.data;
  } catch {
    failed = true;
  }

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Explore courses</h1>
        <p className="mt-1 text-muted-foreground">
          Learn from expert-led courses across every discipline.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CourseFilters categories={categories} />
        </aside>

        <section>
          {failed ? (
            <EmptyState
              title="Couldn't load courses"
              description="There was a problem reaching the catalog. Please refresh to try again."
            />
          ) : courses.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No courses found"
              description="Try removing some filters or searching for something else."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Showing {courses.length} of {total} {total === 1 ? 'course' : 'courses'}
              </p>
              <CourseGrid courses={courses} />
              <div className="mt-10">
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
