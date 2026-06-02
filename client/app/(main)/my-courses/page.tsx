'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useMyCourses } from '@/hooks/useEnrollment';
import { EnrolledCourseCard } from '@/components/dashboard/EnrolledCourseCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tab = 'active' | 'completed';

function Skeletons(): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex overflow-hidden rounded-xl border bg-card">
          <div className="skeleton aspect-square w-40 shrink-0" />
          <div className="flex-1 space-y-3 p-4">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-2 w-full rounded" />
            <div className="skeleton h-8 w-28 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyCoursesPage(): JSX.Element {
  const { data, isLoading, isError, refetch } = useMyCourses();
  const [tab, setTab] = useState<Tab>('active');

  const enrollments = data ?? [];
  const active = enrollments.filter((e) => e.progress.percentage < 100);
  const completed = enrollments.filter((e) => e.progress.percentage >= 100);
  const shown = tab === 'active' ? active : completed;

  return (
    <div className="container py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">My Courses</h1>

      <div role="tablist" aria-label="Course status" className="mt-6 flex gap-1 border-b">
        {(['active', 'completed'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === t ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t} ({t === 'active' ? active.length : completed.length})
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-primary" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Skeletons />
        ) : isError ? (
          <ErrorState title="Couldn't load your courses" onRetry={() => void refetch()} />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={tab === 'active' ? BookOpen : GraduationCap}
            title={tab === 'active' ? 'No courses in progress' : 'No completed courses yet'}
            description={
              tab === 'active'
                ? 'Enroll in a course to start learning.'
                : 'Finish a course to see it here — and earn a certificate.'
            }
            action={
              <Button asChild variant="brand">
                <Link href="/courses">Browse courses</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shown.map((enrollment) => (
              <EnrolledCourseCard key={enrollment._id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
