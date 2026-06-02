'use client';

import Image from 'next/image';
import { getInitials, timeAgo } from '@/lib/utils';
import type { RecentEnrollmentItem } from '@/hooks/useInstructorAnalytics';

interface Props {
  enrollments: RecentEnrollmentItem[];
}

/** Recent 10 enrollments with student avatar, name, course, and time. */
export function RecentEnrollmentsList({ enrollments }: Props): JSX.Element {
  if (enrollments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No recent enrollments.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {enrollments.map((item, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          {/* Student avatar */}
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
            {item.student?.avatar ? (
              <Image
                src={item.student.avatar}
                alt={item.student.name ?? ''}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                {getInitials(item.student?.name ?? '?')}
              </span>
            )}
          </div>
          {/* Details */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight">{item.student?.name ?? '—'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.course?.title ?? '—'}
            </p>
          </div>
          {/* Time ago */}
          <span className="shrink-0 text-xs text-muted-foreground">
            {item.enrolledAt ? timeAgo(item.enrolledAt) : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
