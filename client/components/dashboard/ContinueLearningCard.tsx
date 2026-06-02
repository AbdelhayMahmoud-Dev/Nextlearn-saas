'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import type { IEnrollment } from '@/types';
import { Button } from '@/components/ui/button';
import { ProgressRing } from './ProgressRing';

/** Continue-learning tile with a circular progress ring + resume action. */
export function ContinueLearningCard({ enrollment }: { enrollment: IEnrollment }): JSX.Element {
  const course = enrollment.course;
  const lastLesson = enrollment.progress.lastLesson;
  const resumeHref =
    lastLesson && course
      ? `/learn/${course._id}/${lastLesson}`
      : course
        ? `/courses/${course.slug}`
        : '/my-courses';

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <Link
        href={course ? `/courses/${course.slug}` : '#'}
        className="relative hidden size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:block"
      >
        {course?.thumbnail && (
          <Image src={course.thumbnail} alt={course.title} fill sizes="64px" className="object-cover" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{course?.title ?? 'Course'}</p>
        <p className="text-xs text-muted-foreground">{course?.category}</p>
        <Button asChild variant="brand" size="sm" className="mt-2">
          <Link href={resumeHref}>
            <PlayCircle className="size-4" /> Resume
          </Link>
        </Button>
      </div>

      <ProgressRing value={enrollment.progress.percentage} size={56} stroke={5} />
    </div>
  );
}
