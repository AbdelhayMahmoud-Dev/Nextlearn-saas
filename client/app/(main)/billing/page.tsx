'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePaymentHistory } from '@/hooks/usePayments';
import { useSubscription, useOpenBillingPortal } from '@/hooks/useSubscription';
import type { PaymentStatus } from '@/types';

const STATUS_BADGE: Record<PaymentStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  completed: 'bg-green-500/15 text-green-500',
  refunded: 'bg-amber-500/15 text-amber-500',
  failed: 'bg-red-500/15 text-red-500',
};

function PurchasesTab(): JSX.Element {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePaymentHistory(page);

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground">No purchases yet — browse courses to get started.</p>
        <Button asChild variant="brand" className="mt-4">
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p._id} className="border-b last:border-0">
                <td className="px-4 py-3">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3 capitalize">{p.type}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatPrice(p.amount / 100, p.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_BADGE[p.status])}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.stripeReceiptUrl ? (
                    <a
                      href={p.stripeReceiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                    >
                      View <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function SubscriptionTab(): JSX.Element {
  const { data: subscription, isLoading } = useSubscription();
  const openPortal = useOpenBillingPortal();

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">Current plan</p>
      <p className="font-heading text-2xl font-bold">
        {subscription ? (subscription.plan === 'annual' ? 'Annual Pro' : 'Monthly Pro') : 'Free'}
      </p>
      {subscription && (
        <p className="mt-1 text-sm capitalize text-muted-foreground">{subscription.status.replace('_', ' ')}</p>
      )}
      <div className="mt-4 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/subscription">Manage plan</Link>
        </Button>
        {subscription?.stripeCustomerId && (
          <Button variant="brand" onClick={() => openPortal.mutate()} disabled={openPortal.isPending}>
            {openPortal.isPending && <Loader2 className="size-4 animate-spin" />}
            Manage billing →
          </Button>
        )}
      </div>
    </div>
  );
}

/** Billing: purchase history + subscription overview. */
export default function BillingPage(): JSX.Element {
  const [tab, setTab] = useState<'purchases' | 'subscription'>('purchases');

  return (
    <div className="container max-w-4xl space-y-6 py-10">
      <h1 className="font-heading text-3xl font-bold">Billing</h1>

      <div className="inline-flex rounded-lg border bg-card p-1" role="tablist">
        {(['purchases', 'subscription'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              tab === t ? 'bg-brand-primary text-brand-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'purchases' ? <PurchasesTab /> : <SubscriptionTab />}
    </div>
  );
}
