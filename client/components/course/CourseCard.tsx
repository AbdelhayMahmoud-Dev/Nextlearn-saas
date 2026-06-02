'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import type { ICourse } from '@/types';
import { formatDuration, formatPrice } from '@/lib/utils';
import { StarRating } from './StarRating';

interface CourseCardProps {
  course: ICourse;
  isEnrolled?: boolean;
  progress?: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/**
 * Summary card for a course, with enrollment-aware footer (price vs. progress).
 * @param course - The course to display.
 * @param isEnrolled - Whether the viewing student is enrolled.
 * @param progress - Completion percentage (shown when enrolled).
 */
export function CourseCard({ course, isEnrolled, progress }: CourseCardProps): JSX.Element {
  const sale = course.salePrice;
  const onSale = sale !== undefined && sale < course.price;
  const displayPrice = onSale ? sale : course.price;

  return (
    <motion.article variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.15 }} className="h-full">
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          {course.thumbnail && (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium capitalize">
            {course.level}
          </span>
          {isEnrolled && (
            <span className="absolute right-3 top-3 rounded-full bg-brand-primary px-2.5 py-1 text-xs font-medium text-brand-primary-foreground">
              Enrolled
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <span className="text-xs font-medium text-brand-primary">{course.category}</span>
          <h3 className="mt-1 line-clamp-2 font-heading font-semibold leading-snug group-hover:text-brand-primary">
            {course.title}
          </h3>
          {course.instructor && (
            <p className="mt-1 text-sm text-muted-foreground">{course.instructor.name}</p>
          )}
          <div className="mt-2">
            <StarRating value={course.rating.average} count={course.rating.count} />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" /> {course.totalLessons} lessons
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {formatDuration(course.totalDuration)}
            </span>
          </div>

          <div className="mt-4 flex-1" />

          {isEnrolled && typeof progress === 'number' ? (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {course.price === 0 ? (
                <span className="font-heading text-lg font-bold">Free</span>
              ) : (
                <>
                  <span className="font-heading text-lg font-bold">{formatPrice(displayPrice)}</span>
                  {onSale && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(course.price)}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
