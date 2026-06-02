'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, DollarSign, Loader2, MousePointerClick, TrendingUp } from 'lucide-react';
import {
  useAffiliateCommissions,
  useAffiliateDashboard,
  useAffiliatePayouts,
  useRequestPayout,
  useUpdatePayoutEmail,
} from '@/hooks/useAffiliate';
import { Button } from '@/components/ui/button';
import { formatDate, formatPrice } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';
const money = (cents: number): string => formatPrice(cents / 100);

export default function AffiliatePage(): JSX.Element {
  const dash = useAffiliateDashboard();
  const updateEmail = useUpdatePayoutEmail();
  const requestPayout = useRequestPayout();
  const commissions = useAffiliateCommissions(1);
  const payouts = useAffiliatePayouts(1);

  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (dash.isLoading || !dash.data) {
    return (
      <div className="container max-w-4xl space-y-4 py-10">
        <div className="skeleton h-10 w-48 rounded" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    );
  }

  const { account, minPayoutCents } = dash.data;
  const link = `${APP_URL}/?ref=${account.code}`;
  const canPayout = account.pendingCents >= minPayoutCents && Boolean(account.payoutEmail);

  const copyLink = (): void => {
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Referral link copied');
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const saveEmail = (): void => {
    if (!email.trim()) return;
    updateEmail.mutate(email.trim(), {
      onSuccess: () => {
        toast.success('Payout email saved');
        setEmail('');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const onRequestPayout = (): void => {
    requestPayout.mutate(undefined, {
      onSuccess: () => toast.success('Payout requested'),
      onError: (e) => toast.error(e.message),
    });
  };

  const stats = [
    { label: 'Clicks', value: account.totalClicks.toLocaleString('en-US'), icon: MousePointerClick },
    { label: 'Conversions', value: account.totalConversions.toLocaleString('en-US'), icon: TrendingUp },
    { label: 'Conversion rate', value: `${account.conversionRate}%`, icon: TrendingUp },
    { label: 'Commission rate', value: `${account.commissionRate}%`, icon: DollarSign },
  ];

  return (
    <div className="container max-w-4xl space-y-8 py-10">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Affiliate Program</h1>
        <p className="mt-1 text-muted-foreground">
          Share your link and earn {account.commissionRate}% on every purchase you refer.
        </p>
        {account.status === 'suspended' && (
          <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Your affiliate account is suspended. Contact support for details.
          </p>
        )}
      </div>

      {/* Referral link */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Your referral link</h2>
        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={link}
            aria-label="Referral link"
            className="flex-1 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
          />
          <Button variant="brand" onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy
          </Button>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <s.icon className="size-5 text-brand-primary" />
            <div className="mt-2 font-heading text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Balances + payout */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Earnings</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="font-heading text-2xl font-bold">{money(account.pendingCents)}</div>
          </div>
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="text-sm text-muted-foreground">Paid out</div>
            <div className="font-heading text-2xl font-bold">{money(account.paidCents)}</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="payout-email" className="text-sm font-medium">
            Payout email (PayPal)
          </label>
          <div className="flex gap-2">
            <input
              id="payout-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={account.payoutEmail ?? 'you@example.com'}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button variant="outline" onClick={saveEmail} disabled={updateEmail.isPending}>
              {updateEmail.isPending && <Loader2 className="size-4 animate-spin" />} Save
            </Button>
          </div>
        </div>

        <Button className="mt-4" variant="brand" onClick={onRequestPayout} disabled={!canPayout || requestPayout.isPending}>
          {requestPayout.isPending && <Loader2 className="size-4 animate-spin" />} Request payout
        </Button>
        {!canPayout && (
          <p className="mt-2 text-xs text-muted-foreground">
            Minimum payout is {money(minPayoutCents)}
            {account.payoutEmail ? '.' : ' — add a payout email first.'}
          </p>
        )}
      </section>

      {/* Commissions */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Recent commissions</h2>
        {commissions.data && commissions.data.items.length > 0 ? (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Rate</th>
                <th className="py-2 font-medium">Commission</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.data.items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2">{formatDate(c.createdAt)}</td>
                  <td className="py-2">{money(c.orderAmountCents)}</td>
                  <td className="py-2">{c.rate}%</td>
                  <td className="py-2 font-medium">{money(c.amountCents)}</td>
                  <td className="py-2 capitalize">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No commissions yet.</p>
        )}
      </section>

      {/* Payouts */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Payout history</h2>
        {payouts.data && payouts.data.items.length > 0 ? (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Requested</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.data.items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2">{formatDate(p.createdAt)}</td>
                  <td className="py-2 font-medium">{money(p.amountCents)}</td>
                  <td className="py-2 capitalize">{p.status}</td>
                  <td className="py-2 text-muted-foreground">{p.reference ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No payouts yet.</p>
        )}
      </section>
    </div>
  );
}
