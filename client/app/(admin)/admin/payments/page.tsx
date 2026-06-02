'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PaymentTable } from '@/components/admin/PaymentTable';
import { RefundDialog } from '@/components/admin/RefundDialog';
import { useAdminPayments, useAdminSubscriptions, type AdminPaymentRow } from '@/hooks/useAdminPayments';

function Pager({ meta, onPrev, onNext }: { meta: { page: number; totalPages: number; hasPrev: boolean; hasNext: boolean }; onPrev: () => void; onNext: () => void }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={onPrev}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
      <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={onNext}>Next</Button>
    </div>
  );
}

export default function AdminPaymentsPage(): JSX.Element {
  const [tab, setTab] = useState<'purchases' | 'subscriptions'>('purchases');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [refundTarget, setRefundTarget] = useState<AdminPaymentRow | null>(null);

  const payments = useAdminPayments({ page, status: status || undefined, type: type || undefined });
  const subs = useAdminSubscriptions({ page });

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">Payments</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-card p-1">
          {(['purchases', 'subscriptions'] as const).map((t) => (
            <button key={t} type="button" onClick={() => { setTab(t); setPage(1); }} className={cn('rounded-md px-4 py-1.5 text-sm font-medium capitalize', tab === t ? 'bg-brand-primary text-brand-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
          ))}
        </div>
        {tab === 'purchases' && (
          <div className="flex gap-2">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status" className="rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Type" className="rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="">All types</option>
              <option value="one-time">One-time</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
        )}
      </div>

      {tab === 'purchases' ? (
        payments.isLoading || !payments.data ? (
          <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>
        ) : (
          <>
            <PaymentTable rows={payments.data.items} onRefund={setRefundTarget} />
            <Pager meta={payments.data.meta} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
          </>
        )
      ) : subs.isLoading || !subs.data ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Period end</th>
                  <th className="px-4 py-3 font-medium">Cancel at end</th>
                </tr>
              </thead>
              <tbody>
                {subs.data.items.map((s) => (
                  <tr key={s._id} className="border-b last:border-0">
                    <td className="px-4 py-3">{s.user?.name ?? '—'}<div className="text-xs text-muted-foreground">{s.user?.email}</div></td>
                    <td className="px-4 py-3 capitalize">{s.plan}</td>
                    <td className="px-4 py-3 capitalize">{s.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : '—'}</td>
                    <td className="px-4 py-3">{s.cancelAtPeriodEnd ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager meta={subs.data.meta} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
        </>
      )}

      <RefundDialog payment={refundTarget} onClose={() => setRefundTarget(null)} />
    </div>
  );
}
