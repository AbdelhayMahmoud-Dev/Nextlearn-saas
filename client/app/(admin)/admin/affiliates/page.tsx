'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  useAdminAffiliateOverview,
  useAdminAffiliatePayouts,
  useAdminAffiliates,
  useMarkPayoutPaid,
  useSetAffiliateRate,
  useSetAffiliateStatus,
} from '@/hooks/useAffiliate';
import { Button } from '@/components/ui/button';
import { cn, formatDate, formatPrice } from '@/lib/utils';

const money = (cents: number): string => formatPrice(cents / 100);

export default function AdminAffiliatesPage(): JSX.Element {
  const [tab, setTab] = useState<'affiliates' | 'payouts'>('affiliates');
  const [page, setPage] = useState(1);
  const overview = useAdminAffiliateOverview();
  const affiliates = useAdminAffiliates(page);
  const payouts = useAdminAffiliatePayouts(page);
  const setStatus = useSetAffiliateStatus();
  const setRate = useSetAffiliateRate();
  const markPaid = useMarkPayoutPaid();

  const onToggleStatus = (id: string, current: 'active' | 'suspended'): void => {
    const next = current === 'active' ? 'suspended' : 'active';
    setStatus.mutate({ id, status: next }, { onError: (e) => toast.error(e.message) });
  };

  const onRate = (id: string, value: string): void => {
    const rate = Number(value);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) return;
    setRate.mutate({ id, rate }, { onError: (e) => toast.error(e.message) });
  };

  const onMarkPaid = (id: string): void => {
    const reference = window.prompt('Payout reference (optional, e.g. PayPal batch id):') ?? undefined;
    markPaid.mutate(
      { id, reference: reference || undefined },
      {
        onSuccess: () => toast.success('Payout marked paid'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold">Affiliates</h1>

      {/* Overview */}
      {overview.data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Affiliates', value: overview.data.affiliates.toLocaleString('en-US') },
            { label: 'Pending', value: money(overview.data.pendingCents) },
            { label: 'Paid out', value: money(overview.data.paidCents) },
            { label: 'Conversions', value: overview.data.totalConversions.toLocaleString('en-US') },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-4">
              <div className="font-heading text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="inline-flex rounded-lg border bg-card p-1">
        {(
          [
            ['affiliates', 'Affiliates'],
            ['payouts', 'Payouts'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setPage(1);
            }}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium',
              tab === id ? 'bg-brand-primary text-brand-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'affiliates' ? (
        affiliates.isLoading || !affiliates.data ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-brand-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Affiliate</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Rate %</th>
                  <th className="px-4 py-3 font-medium">Clicks</th>
                  <th className="px-4 py-3 font-medium">Conversions</th>
                  <th className="px-4 py-3 font-medium">Pending</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.data.items.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {a.user?.name ?? '—'}
                      <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={a.commissionRate}
                        onBlur={(e) => onRate(a.id, e.target.value)}
                        aria-label={`Commission rate for ${a.code}`}
                        className="w-16 rounded border bg-background px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">{a.totalClicks}</td>
                    <td className="px-4 py-3">{a.totalConversions}</td>
                    <td className="px-4 py-3">{money(a.pendingCents)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant={a.status === 'active' ? 'outline' : 'brand'}
                        size="sm"
                        onClick={() => onToggleStatus(a.id, a.status)}
                      >
                        {a.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : payouts.isLoading || !payouts.data ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Affiliate</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.data.items.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.affiliateCode ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{money(p.amountCents)}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3">
                    {p.status !== 'paid' && (
                      <Button size="sm" variant="brand" onClick={() => onMarkPaid(p.id)} disabled={markPaid.isPending}>
                        Mark paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {payouts.data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No payout requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
