'use client';

import { ExternalLink } from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import type { PaymentStatus } from '@/types';
import type { AdminPaymentRow } from '@/hooks/useAdminPayments';

const STATUS: Record<PaymentStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  completed: 'bg-green-500/15 text-green-500',
  refunded: 'bg-amber-500/15 text-amber-500',
  failed: 'bg-red-500/15 text-red-500',
};

/** Admin payments table; refund action shown for completed one-time payments. */
export function PaymentTable({ rows, onRefund }: { rows: AdminPaymentRow[]; onRefund: (p: AdminPaymentRow) => void }): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Course</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p._id} className="border-b last:border-0">
              <td className="px-4 py-3">{formatDate(p.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{p.user?.name ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{p.user?.email}</div>
              </td>
              <td className="px-4 py-3">{p.type === 'subscription' ? 'Subscription' : p.course?.title ?? '—'}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{p.type}</span></td>
              <td className="px-4 py-3 text-right font-medium">{formatPrice(p.amount / 100, p.currency)}</td>
              <td className="px-4 py-3"><span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS[p.status])}>{p.status}</span></td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3 text-xs">
                  {p.stripeReceiptUrl && (
                    <a href={p.stripeReceiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-primary hover:underline">
                      Receipt <ExternalLink className="size-3" />
                    </a>
                  )}
                  {p.status === 'completed' && p.type === 'one-time' && (
                    <button type="button" onClick={() => onRefund(p)} className="text-amber-500 hover:underline">Refund</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
