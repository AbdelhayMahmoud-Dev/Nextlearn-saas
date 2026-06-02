'use client';

import dynamic from 'next/dynamic';
import { Info } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { useInstructorRevenue } from '@/hooks/useInstructorAnalytics';

// Recharts loaded lazily
const EarningsRevenueChart = dynamic(
  () =>
    import('@/components/instructor/EarningsRevenueChart').then(
      (m) => m.EarningsRevenueChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-lg bg-muted" />,
  },
);

function StatBox({
  label, value, sub,
}: {
  label: string;
  value: string;
  sub?: string;
}): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Instructor earnings page with revenue overview, chart, and payout info. */
export default function InstructorEarningsPage(): JSX.Element {
  const { data, isLoading, isError, refetch } = useInstructorRevenue();

  if (isError) {
    return <ErrorState title="Couldn't load earnings" onRetry={() => void refetch()} />;
  }

  const revenue = data as {
    totalRevenue?: number;
    monthlyRevenue?: number;
    availablePayout?: number;
    revenueByMonth?: { month: string; oneTime: number; subscription: number }[];
  } | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-56 rounded-xl" />
      </div>
    );
  }

  const total = revenue?.totalRevenue ?? 0;
  const monthly = revenue?.monthlyRevenue ?? 0;
  const payout = revenue?.availablePayout ?? 0;
  const chartData = revenue?.revenueByMonth ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Earnings</h1>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox label="Total Earnings" value={`$${total.toLocaleString('en-US')}`} sub="All time" />
        <StatBox label="This Month" value={`$${monthly.toLocaleString('en-US')}`} />
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">Available Payout</p>
          <p className="mt-1 font-heading text-3xl font-bold">${payout.toLocaleString('en-US')}</p>
          <button
            type="button"
            disabled
            title="Payout via Stripe Connect will be configured in Phase 6. Your earnings are tracked and will be available when setup is complete."
            className="mt-2 inline-flex cursor-not-allowed items-center gap-1.5 rounded-md bg-brand-primary/30 px-3 py-1.5 text-xs font-medium text-brand-primary opacity-60"
          >
            Request Payout <Info className="size-3" />
          </button>
          <p className="mt-1.5 text-[10px] text-muted-foreground">Stripe Connect setup in Phase 6</p>
        </div>
      </div>

      {/* Revenue chart */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">Revenue over time</h2>
        <EarningsRevenueChart data={chartData} />
      </section>

      {/* Breakdown */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">Revenue Breakdown</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>One-time purchases</span>
            <span className="font-medium">${total.toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Subscriptions</span>
            <span>$0 (Phase 4)</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Gross revenue</span>
            <span>${total.toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform fee (20%)</span>
            <span>-${Math.round(total * 0.2).toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-green-600">
            <span>Net earnings</span>
            <span>${Math.round(total * 0.8).toLocaleString('en-US')}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
