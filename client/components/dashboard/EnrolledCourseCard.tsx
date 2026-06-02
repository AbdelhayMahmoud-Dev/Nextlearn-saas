'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Award, PlayCircle } from 'lucide-react';
import type { IEnrollment } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Compact enrolled-course row with progress and a context-aware action. */
export function EnrolledCourseCard({ enrollment }: { enrollment: IEnrollment }): JSX.Element {
  const course = enrollment.course;
  const percentage = enrollment.progress.percentage;
  const completed = percentage >= 100;
  const lastLesson = enrollment.progress.lastLesson;

  const continueHref =
    lastLesson && course
      ? `/learn/${course._id}/${lastLesson}`
      : course
        ? `/courses/${course.slug}`
        : '/my-courses';

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card sm:flex-row">
      <Link
        href={course ? `/courses/${course.slug}` : '#'}
        className="relative aspect-video w-full shrink-0 bg-muted sm:aspect-square sm:w-40"
      >
        {course?.thumbnail && (
          <Image src={course.thumbnail} alt={course.title} fill sizes="160px" className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium text-brand-primary">{course?.category}</span>
        <h3 className="mt-1 line-clamp-2 font-heading font-semibold">
          {course?.title ?? 'Course'}
        </h3>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{percentage}% complete</span>
            <span>Updated {formatDate(enrollment.updatedAt)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-primary" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="mt-4">
          {completed ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/certificates">
                <Award className="size-4" /> Get certificate
              </Link>
            </Button>
          ) : (
            <Button asChild variant="brand" size="sm">
              <Link href={continueHref}>
                <PlayCircle className="size-4" /> {percentage > 0 ? 'Continue' : 'Start learning'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
