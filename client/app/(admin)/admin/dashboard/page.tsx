'use client';

import dynamic from 'next/dynamic';
import {
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  GraduationCap,
  Repeat,
  Star,
  TrendingDown,
  Users,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { KpiCard } from '@/components/admin/KpiCard';
import { TopCoursesWidget } from '@/components/admin/TopCoursesWidget';
import {
  useAdminCategories,
  useAdminKpis,
  useAdminRevenueChart,
  useAdminTopCourses,
  useAdminUserGrowth,
} from '@/hooks/useAdminAnalytics';

const chartFallback = <div className="skeleton h-[300px] w-full rounded-lg" />;
const AdminRevenueChart = dynamic(() => import('@/components/admin/AdminRevenueChart').then((m) => m.AdminRevenueChart), { ssr: false, loading: () => chartFallback });
const UserGrowthChart = dynamic(() => import('@/components/admin/UserGrowthChart').then((m) => m.UserGrowthChart), { ssr: false, loading: () => chartFallback });
const CategoryPieChart = dynamic(() => import('@/components/admin/CategoryPieChart').then((m) => m.CategoryPieChart), { ssr: false, loading: () => chartFallback });

/** Admin platform-overview dashboard. */
export default function AdminDashboardPage(): JSX.Element {
  const kpis = useAdminKpis();
  const revenue = useAdminRevenueChart();
  const growth = useAdminUserGrowth();
  const categories = useAdminCategories();
  const top = useAdminTopCourses();
  const k = kpis.data;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Platform Overview</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="MRR" value={k ? formatPrice(k.monthlyRecurringRevenue) : '—'} icon={Repeat} />
        <KpiCard label="Revenue (mo)" value={k ? formatPrice(k.monthlyRevenue) : '—'} change={k?.revenueGrowth} icon={DollarSign} />
        <KpiCard label="Users" value={k ? k.totalUsers.toLocaleString('en-US') : '—'} change={k?.userGrowth} icon={Users} />
        <KpiCard label="Enrollments" value={k ? k.totalEnrollments.toLocaleString('en-US') : '—'} change={k?.enrollmentGrowth} icon={GraduationCap} />
        <KpiCard label="Courses" value={k ? k.totalCourses : '—'} icon={BookOpen} />
        <KpiCard label="Avg Rating" value={k ? k.averageRating.toFixed(1) : '—'} icon={Star} />
        <KpiCard label="Churn" value={k ? `${k.churnRate}%` : '—'} icon={TrendingDown} />
        <KpiCard label="Active Subs" value={k ? k.activeSubscriptions : '—'} icon={CreditCard} />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
          <BarChart3 className="size-5 text-brand-primary" /> Revenue &amp; Enrollments — last 12 months
        </h2>
        {revenue.data ? <AdminRevenueChart data={revenue.data} /> : chartFallback}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">User Growth (30d)</h2>
          {growth.data ? <UserGrowthChart data={growth.data} /> : chartFallback}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">Category Breakdown</h2>
          {categories.data ? <CategoryPieChart data={categories.data} /> : chartFallback}
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Top Courses</h2>
        {top.data ? <TopCoursesWidget rows={top.data} /> : <div className="skeleton h-32 w-full rounded" />}
      </section>
    </div>
  );
}
