'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Award, BookOpen, Clock, Flame } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { AchievementBadges } from '@/components/dashboard/AchievementBadges';
import { RecommendedCourses } from '@/components/dashboard/RecommendedCourses';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/utils';

// Recharts is ~80 KB and renders only below the fold; load it lazily so it
// stays out of the dashboard's initial JS bundle.
const ActivityChart = dynamic(
  () => import('@/components/dashboard/ActivityChart').then((m) => m.ActivityChart),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />,
  },
);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function DashboardSkeleton(): JSX.Element {
  return (
    <div className="container space-y-8 py-10">
      <div className="skeleton h-9 w-64 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );
}

export default function DashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const { data, isLoading, isError, refetch } = useDashboard();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <div className="container py-10">
        <ErrorState title="Couldn't load your dashboard" onRetry={() => void refetch()} />
      </div>
    );
  }

  const { stats, continueLearning, recentActivity, activity } = data;

  return (
    <div className="container space-y-10 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {greeting()}, {firstName}
        </h1>
        {stats.streakDays > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400">
            <Flame className="size-4" /> {stats.streakDays}-day streak
          </span>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={BookOpen} label="Courses enrolled" value={stats.enrolledCount} />
        <StatsCard icon={Clock} label="Hours learned" value={stats.hoursLearned} />
        <StatsCard icon={Award} label="Certificates" value={stats.certificatesCount} />
        <StatsCard icon={Flame} label="Day streak" value={stats.streakDays} />
      </section>

      <section>
        <h2 className="mb-4 font-heading text-xl font-semibold">Continue learning</h2>
        {continueLearning.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nothing in progress"
            description="Enroll in a course to start learning."
            action={
              <Button asChild variant="brand">
                <Link href="/courses">Browse courses</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {continueLearning.map((enrollment) => (
              <ContinueLearningCard key={enrollment._id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>

      <UpcomingSessions />

      <AchievementBadges stats={stats} />

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-heading text-xl font-semibold">Learning activity</h2>
          <ActivityChart data={activity} />
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-heading text-xl font-semibold">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed lessons yet.</p>
          ) : (
            <ul className="space-y-4">
              {recentActivity.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-primary" />
                  <div>
                    <p className="font-medium leading-snug">{item.lessonTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.courseTitle} · {timeAgo(item.completedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <RecommendedCourses />
    </div>
  );
}
