'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { ErrorState } from '@/components/common/ErrorState';
import { DashboardOverviewCards } from '@/components/instructor/DashboardOverviewCards';
import { TopCoursesTable } from '@/components/instructor/TopCoursesTable';
import { RecentEnrollmentsList } from '@/components/instructor/RecentEnrollmentsList';
import { useInstructorAnalytics } from '@/hooks/useInstructorAnalytics';

// Revenue chart uses Recharts — load lazily to keep initial bundle lean
const InstructorRevenueChart = dynamic(
  () =>
    import('@/components/instructor/InstructorRevenueChart').then(
      (m) => m.InstructorRevenueChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-60 w-full animate-pulse rounded-lg bg-muted" />,
  },
);

function DashboardSkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-60 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
}

/** Instructor dashboard — analytics overview, revenue chart, top courses, recent enrollments. */
export default function InstructorDashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Instructor';
  const { data, isLoading, isError, refetch } = useInstructorAnalytics();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Couldn't load dashboard"
        description="There was a problem fetching your analytics."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Welcome back, {firstName}</h1>
      </div>

      {/* Stats grid */}
      <DashboardOverviewCards stats={data.overview} />

      {/* Revenue & enrollments chart */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Revenue & Enrollments — last 12 months
        </h2>
        <InstructorRevenueChart data={data.revenueChart} />
      </section>

      {/* Bottom two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Top Courses</h2>
          <TopCoursesTable courses={data.topCourses} />
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Recent Enrollments</h2>
          <RecentEnrollmentsList enrollments={data.recentEnrollments} />
        </section>
      </div>
    </div>
  );
}
