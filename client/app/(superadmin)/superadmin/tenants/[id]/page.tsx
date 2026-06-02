'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandPreview } from '@/components/admin/BrandPreview';
import {
  useDeleteTenant,
  useSuperAdminTenant,
  useToggleTenantStatus,
  useUpdateTenantPlan,
} from '@/hooks/useSuperAdminTenants';
import type { TenantPlan } from '@/types';

export default function TenantDetailPage({ params }: { params: { id: string } }): JSX.Element {
  const router = useRouter();
  const { data: t, isLoading } = useSuperAdminTenant(params.id);
  const toggle = useToggleTenantStatus();
  const updatePlan = useUpdateTenantPlan();
  const del = useDeleteTenant();
  const [plan, setPlan] = useState<TenantPlan>('free');
  const [expires, setExpires] = useState('');

  if (isLoading || !t) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }
  const id = params.id;
  const stripeLabel = t.stripeOnboardingComplete ? 'Connected ✅' : t.stripeAccountId ? 'Onboarding…' : 'Not connected';

  const onDelete = (): void => {
    const confirmSlug = window.prompt(`Type the slug "${t.slug}" to permanently delete this tenant:`);
    if (confirmSlug !== t.slug) {
      if (confirmSlug !== null) toast.error('Slug did not match');
      return;
    }
    del.mutate({ id, confirmSlug }, { onSuccess: () => { toast.success('Tenant deleted'); router.push('/superadmin/tenants'); }, onError: (e) => toast.error(e.message) });
  };

  const kpi = (label: string, value: string | number): JSX.Element => (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link href="/superadmin/tenants" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{t.slug}.nextlearn.com</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', t.isActive ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500')}>
            {t.isActive ? 'Active' : 'Suspended'}
          </span>
          <Button variant="outline" size="sm" onClick={() => toggle.mutate({ id, isActive: !t.isActive }, { onError: (e) => toast.error(e.message) })}>
            {t.isActive ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpi('Users', t.kpis.userCount.toLocaleString('en-US'))}
        {kpi('Courses', t.kpis.courseCount.toLocaleString('en-US'))}
        {kpi('Enrollments', t.kpis.enrollmentCount.toLocaleString('en-US'))}
        {kpi('Revenue (mo)', formatPrice(t.kpis.monthlyRevenue))}
        {kpi('Stripe', stripeLabel)}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current: <span className="font-medium capitalize">{t.plan}</span>
          {t.planExpiresAt ? ` · expires ${formatDate(t.planExpiresAt)}` : ''} · created {formatDate(t.createdAt)}
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <select value={plan} onChange={(e) => setPlan(e.target.value as TenantPlan)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="w-40" />
          <Button variant="outline" onClick={() => updatePlan.mutate({ id, plan, planExpiresAt: expires ? new Date(expires).toISOString() : null }, { onSuccess: () => toast.success('Plan updated'), onError: (e) => toast.error(e.message) })}>
            Update plan
          </Button>
        </div>
      </div>

      <BrandPreview platformName={t.name} primaryColor={t.branding.primaryColor} accentColor={t.branding.accentColor} logo={t.branding.logo} />

      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="font-heading text-lg font-semibold text-red-500">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">Hard-deletes the tenant and all of its data. This cannot be undone.</p>
        <Button variant="outline" className="mt-3 text-red-500" onClick={onDelete}>Delete tenant</Button>
      </div>
    </div>
  );
}
