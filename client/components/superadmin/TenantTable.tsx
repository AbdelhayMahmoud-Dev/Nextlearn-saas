'use client';

import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import type { TenantRow } from '@/hooks/useSuperAdminTenants';

interface Props {
  rows: TenantRow[];
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (tenant: TenantRow) => void;
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-500/15 text-blue-500',
  pro: 'bg-violet-500/15 text-violet-500',
  enterprise: 'bg-amber-500/15 text-amber-500',
};

/** SuperAdmin tenant table. */
export function TenantTable({ rows, onToggleStatus, onDelete }: Props): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 text-right font-medium">Users</th>
            <th className="px-4 py-3 text-right font-medium">Revenue (mo)</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t._id} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
              <td className="px-4 py-3">
                <Link href={`/superadmin/tenants/${t._id}`} className="font-medium hover:text-brand-primary">{t.name}</Link>
              </td>
              <td className="px-4 py-3">
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', PLAN_BADGE[t.plan])}>{t.plan}</span>
              </td>
              <td className="px-4 py-3 text-right">{t.kpis.userCount.toLocaleString('en-US')}</td>
              <td className="px-4 py-3 text-right">{formatPrice(t.kpis.monthlyRevenue)}</td>
              <td className="px-4 py-3">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', t.isActive ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500')}>
                  {t.isActive ? 'Active' : 'Suspended'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-3 text-xs">
                  <Link href={`/superadmin/tenants/${t._id}`} className="text-brand-primary hover:underline">View</Link>
                  <button type="button" onClick={() => onToggleStatus(t._id, !t.isActive)} className="text-muted-foreground hover:text-foreground">
                    {t.isActive ? 'Suspend' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => onDelete(t)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
