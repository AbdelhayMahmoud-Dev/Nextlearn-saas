'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { RevenueBreakdown } from '@/components/admin/RevenueBreakdown';
import { EnrollmentHeatmap } from '@/components/admin/EnrollmentHeatmap';
import { TopCoursesWidget } from '@/components/admin/TopCoursesWidget';
import {
  useAdminCategories,
  useAdminRevenueChart,
  useAdminTopCourses,
  useAdminUserGrowth,
} from '@/hooks/useAdminAnalytics';

const fallback = <div className="skeleton h-[300px] w-full rounded-lg" />;
const AdminRevenueChart = dynamic(() => import('@/components/admin/AdminRevenueChart').then((m) => m.AdminRevenueChart), { ssr: false, loading: () => fallback });
const UserGrowthChart = dynamic(() => import('@/components/admin/UserGrowthChart').then((m) => m.UserGrowthChart), { ssr: false, loading: () => fallback });

export default function AdminAnalyticsPage(): JSX.Element {
  const revenue = useAdminRevenueChart();
  const categories = useAdminCategories();
  const top = useAdminTopCourses();
  const growth = useAdminUserGrowth();
  const [category, setCategory] = useState('');

  const cats = categories.data ?? [];
  const filteredCats = category ? cats.filter((c) => c.category === category) : cats;

  const onExport = (): void => {
    const rows = revenue.data ?? [];
    const csv = ['Month,Revenue,Enrollments,Subscriptions', ...rows.map((r) => `${r.month},${r.revenue},${r.enrollments},${r.subscriptions}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-revenue.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <Link
          href="/admin/analytics/advanced"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:border-brand-primary"
        >
          <Sparkles className="size-4" /> Advanced insights
        </Link>
      </div>
      <AnalyticsFilters categories={cats.map((c) => c.category)} category={category} onCategory={setCategory} onExport={onExport} />

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Revenue over time</h2>
        {revenue.data ? <AdminRevenueChart data={revenue.data} /> : fallback}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">Enrollments by category</h2>
          <EnrollmentHeatmap data={filteredCats} />
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">Revenue breakdown</h2>
          <RevenueBreakdown data={filteredCats} />
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Top performing courses</h2>
        {top.data ? <TopCoursesWidget rows={top.data} /> : fallback}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">User acquisition (30d)</h2>
        {growth.data ? <UserGrowthChart data={growth.data} /> : fallback}
      </section>
    </div>
  );
}
