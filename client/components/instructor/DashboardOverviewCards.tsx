'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OverviewStats } from '@/hooks/useInstructorAnalytics';

interface CardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number; // positive = good, negative = bad
}

function StatCard({ label, value, sub, trend }: CardProps): JSX.Element {
  const trendColor = trend === undefined ? '' : trend >= 0 ? 'text-green-600' : 'text-red-500';
  const TrendIcon = trend !== undefined && trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
      {(sub ?? trend !== undefined) && (
        <div className={cn('mt-1 flex items-center gap-1 text-xs', trendColor)}>
          {trend !== undefined && <TrendIcon className="size-3" aria-hidden="true" />}
          <span>{sub ?? `${trend! > 0 ? '+' : ''}${trend}%`}</span>
        </div>
      )}
    </div>
  );
}

interface Props {
  stats: OverviewStats;
}

/** Six overview stat cards for the instructor dashboard. */
export function DashboardOverviewCards({ stats }: Props): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Total revenue"
        value={`$${stats.totalRevenue.toLocaleString('en-US')}`}
        sub="All time"
      />
      <StatCard
        label="Students"
        value={stats.totalStudents.toLocaleString('en-US')}
        sub={`+${stats.newStudentsThisMonth} this month`}
      />
      <StatCard
        label="Courses"
        value={stats.totalCourses}
        sub={`${stats.publishedCourses} published`}
      />
      <StatCard
        label="Avg rating"
        value={`⭐ ${stats.averageRating.toFixed(1)}`}
      />
      <StatCard
        label="Reviews"
        value={stats.totalReviews.toLocaleString('en-US')}
      />
      <StatCard
        label="MoM growth"
        value={`${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`}
        trend={stats.revenueGrowth}
      />
    </div>
  );
}
