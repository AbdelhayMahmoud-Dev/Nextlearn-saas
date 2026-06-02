'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ICourse } from '@/types';
import { useMyCourses } from '@/hooks/useEnrollment';
import { CourseGrid } from '@/components/course/CourseGrid';

/** Recommends courses by the student's enrolled category, excluding enrolled ones. */
export function RecommendedCourses(): JSX.Element | null {
  const { data: enrollments = [] } = useMyCourses();
  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const category = enrollments.find((e) => e.course?.category)?.course?.category;

  const { data: courses = [] } = useQuery({
    queryKey: ['recommended', category ?? 'featured'],
    queryFn: async (): Promise<ICourse[]> => {
      const path = category
        ? `/courses?category=${encodeURIComponent(category)}&limit=8`
        : '/courses/featured';
      return (await apiClient.get<ApiResponse<ICourse[]>>(path)).data.data;
    },
  });

  const recommended = courses.filter((c) => !enrolledIds.has(c._id)).slice(0, 4);
  if (recommended.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold">Recommended for you</h2>
      <CourseGrid courses={recommended} />
    </section>
  );
}
