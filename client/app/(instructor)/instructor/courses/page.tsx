'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit3, BarChart2 } from 'lucide-react';
import { useInstructorCourses } from '@/hooks/useInstructorCourses';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** List of the instructor's own courses with edit/analytics actions. */
export default function InstructorCoursesPage(): JSX.Element {
  const { data: courses, isLoading, isError, refetch } = useInstructorCourses();
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <ErrorState title="Couldn't load courses" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">My Courses</h1>
        <Button asChild variant="brand">
          <Link href="/instructor/courses/create">
            <PlusCircle className="size-4 mr-2" /> New Course
          </Link>
        </Button>
      </div>

      {courses?.length === 0 ? (
        <EmptyState
          icon={PlusCircle}
          title="No courses yet"
          description="Create your first course and start teaching."
          action={
            <Button asChild variant="brand">
              <Link href="/instructor/courses/create">Create Course</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {courses?.map((course) => (
            <div key={course._id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
              {course.thumbnail && (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={course.thumbnail} alt={course.title} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{course.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {course.enrolledCount} students · Updated {formatDate(course.updatedAt)}
                </p>
                <span className={cn(
                  'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                  course.isPublished
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                )}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/instructor/courses/${course._id}/edit`}>
                    <Edit3 className="size-3.5 mr-1" /> Edit
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/instructor/courses/${course._id}/analytics`}>
                    <BarChart2 className="size-3.5 mr-1" /> Analytics
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
