'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { TopCourseItem } from '@/hooks/useInstructorAnalytics';

interface Props {
  courses: TopCourseItem[];
}

/** Table showing the top 5 courses by enrollment with revenue and rating. */
export function TopCoursesTable({ courses }: Props): JSX.Element {
  if (courses.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No courses yet.{' '}
        <Link href="/instructor/courses/create" className="text-brand-primary underline">
          Create your first course
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Course</th>
            <th className="pb-2 font-medium text-right">Students</th>
            <th className="pb-2 font-medium text-right">Revenue</th>
            <th className="pb-2 font-medium text-right">Rating</th>
            <th className="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {courses.map((item, i) => (
            <tr key={item.course?._id ?? i} className="group">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  {item.course?.thumbnail && (
                    <div className="relative size-8 shrink-0 overflow-hidden rounded">
                      <Image
                        src={item.course.thumbnail}
                        alt={item.course.title ?? ''}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="font-medium leading-tight line-clamp-1">
                    {item.course?.title ?? '—'}
                  </span>
                </div>
              </td>
              <td className="py-3 text-right">{item.enrollments}</td>
              <td className="py-3 text-right">${item.revenue.toLocaleString('en-US')}</td>
              <td className="py-3 text-right">
                {item.averageRating > 0 ? `⭐ ${item.averageRating.toFixed(1)}` : '—'}
              </td>
              <td className="py-3 text-right">
                {item.course?._id && (
                  <Link
                    href={`/instructor/courses/${item.course._id}/analytics`}
                    className="text-xs text-brand-primary hover:underline"
                  >
                    View analytics
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
