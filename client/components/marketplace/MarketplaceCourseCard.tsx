'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, Star } from 'lucide-react';
import type { MarketplaceCourse } from '@/hooks/useMarketplace';
import { formatDuration, formatPrice } from '@/lib/utils';

/** Course card for marketplace grids (featured/trending/top-rated). */
export function MarketplaceCourseCard({ course }: { course: MarketplaceCourse }): JSX.Element {
  const onSale = course.salePrice !== undefined && course.salePrice < course.price;
  const price = onSale ? (course.salePrice as number) : course.price;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium text-brand-primary">{course.category}</span>
        <h3 className="mt-1 line-clamp-2 font-heading font-semibold leading-snug group-hover:text-brand-primary">
          {course.title}
        </h3>
        {course.instructor && (
          <p className="mt-1 text-sm text-muted-foreground">{course.instructor.name}</p>
        )}
        <div className="mt-2 flex items-center gap-1 text-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium">{course.rating.average.toFixed(1)}</span>
          <span className="text-muted-foreground">({course.rating.count})</span>
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
        <div className="flex items-center gap-2">
          {course.price === 0 ? (
            <span className="font-heading text-lg font-bold">Free</span>
          ) : (
            <>
              <span className="font-heading text-lg font-bold">{formatPrice(price)}</span>
              {onSale && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(course.price)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
