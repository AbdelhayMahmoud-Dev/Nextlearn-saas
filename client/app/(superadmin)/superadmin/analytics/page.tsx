'use client';

import { BarChart3, Building2, DollarSign, GraduationCap, Landmark, Loader2, Users } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { GlobalKpiCard } from '@/components/superadmin/GlobalKpiCard';
import { useGlobalAnalytics } from '@/hooks/useSuperAdminAnalytics';

/** SuperAdmin cross-tenant analytics. */
export default function GlobalAnalyticsPage(): JSX.Element {
  const { data, isLoading } = useGlobalAnalytics();

  if (isLoading || !data) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }

  const maxRevenue = Math.max(1, ...data.revenueByTenant.map((r) => r.revenue));
  const maxNew = Math.max(1, ...data.monthlyNewTenants.map((m) => m.count));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Global Analytics</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <GlobalKpiCard label="Tenants" value={`${data.activeTenants}/${data.totalTenants}`} icon={Building2} />
        <GlobalKpiCard label="Users" value={data.totalUsers.toLocaleString('en-US')} icon={Users} />
        <GlobalKpiCard label="Revenue" value={formatPrice(data.totalRevenue)} icon={DollarSign} />
        <GlobalKpiCard label="Platform fees" value={formatPrice(data.platformFeeRevenue)} icon={Landmark} />
        <GlobalKpiCard label="Enrollments" value={data.totalEnrollments.toLocaleString('en-US')} icon={GraduationCap} />
        <GlobalKpiCard label="New tenants (mo)" value={data.newTenantsThisMonth} icon={BarChart3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">Revenue by tenant (top 10)</h2>
          <div className="space-y-3">
            {data.revenueByTenant.map((r) => (
              <div key={r.tenantId}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{r.tenantName}</span>
                  <span className="text-muted-foreground">{formatPrice(r.revenue)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full bg-brand-primary')} style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
            {data.revenueByTenant.length === 0 && <p className="text-sm text-muted-foreground">No revenue yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">New tenants per month</h2>
          <div className="flex h-48 items-end gap-1">
            {data.monthlyNewTenants.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-brand-primary/70" style={{ height: `${(m.count / maxNew) * 100}%`, minHeight: m.count > 0 ? 4 : 0 }} title={`${m.month}: ${m.count}`} />
                <span className="text-[9px] text-muted-foreground">{m.month.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Top tenants by revenue</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2 font-medium">#</th><th className="py-2 font-medium">Tenant</th><th className="py-2 text-right font-medium">Users</th><th className="py-2 text-right font-medium">Revenue</th></tr>
            </thead>
            <tbody>
              {data.revenueByTenant.map((r, i) => (
                <tr key={r.tenantId} className="border-t">
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2">{r.tenantName}</td>
                  <td className="py-2 text-right">{r.userCount.toLocaleString('en-US')}</td>
                  <td className="py-2 text-right">{formatPrice(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
