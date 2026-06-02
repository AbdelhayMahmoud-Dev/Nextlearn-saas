'use client';

import { Check, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  useSubscription,
  useCreateSubscription,
  useOpenBillingPortal,
} from '@/hooks/useSubscription';
import type { SubscriptionStatus } from '@/types';

const PLANS = [
  { plan: 'monthly' as const, label: 'Monthly Pro', price: '$29', period: '/mo', note: '' },
  { plan: 'annual' as const, label: 'Annual Pro', price: '$199', period: '/yr', note: 'Save 43%' },
];

const FEATURES = [
  'Unlimited access to all courses',
  'Certificates of completion',
  'Priority support',
  'Early access to new courses',
];

const STATUS_LABEL: Record<SubscriptionStatus, { text: string; className: string }> = {
  active: { text: 'Active ✅', className: 'text-green-500' },
  trialing: { text: 'Trialing', className: 'text-blue-500' },
  past_due: { text: 'Past due ⚠️', className: 'text-amber-500' },
  canceled: { text: 'Canceled ❌', className: 'text-red-500' },
  incomplete: { text: 'Incomplete', className: 'text-muted-foreground' },
  unpaid: { text: 'Unpaid ⚠️', className: 'text-amber-500' },
};

/** Subscription management: current plan + change-plan + billing portal. */
export default function SubscriptionPage(): JSX.Element {
  const { data: subscription, isLoading } = useSubscription();
  const createSubscription = useCreateSubscription();
  const openPortal = useOpenBillingPortal();

  const isActive =
    subscription &&
    (subscription.status === 'active' ||
      subscription.status === 'trialing' ||
      subscription.status === 'past_due');
  const currentPlan = isActive ? subscription.plan : null;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl space-y-8 py-10">
      <h1 className="font-heading text-3xl font-bold">Your subscription</h1>

      {/* Current plan card */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="font-heading text-2xl font-bold">
              {currentPlan ? (currentPlan === 'annual' ? 'Annual Pro' : 'Monthly Pro') : 'Free'}
            </p>
            {subscription && (
              <p className={cn('mt-1 text-sm font-medium', STATUS_LABEL[subscription.status].className)}>
                {STATUS_LABEL[subscription.status].text}
              </p>
            )}
            {isActive && subscription.currentPeriodEnd && (
              <p className="mt-2 text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Access ends' : 'Renews'} on{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
          {subscription?.stripeCustomerId && (
            <Button
              variant="outline"
              onClick={() => openPortal.mutate()}
              disabled={openPortal.isPending}
            >
              {openPortal.isPending && <Loader2 className="size-4 animate-spin" />}
              Manage billing →
            </Button>
          )}
        </div>
      </section>

      {/* Change plan */}
      <section>
        <h2 className="mb-4 font-heading text-xl font-semibold">
          {currentPlan ? 'Change plan' : 'Upgrade to Pro'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.map((p) => {
            const isCurrent = currentPlan === p.plan;
            return (
              <div
                key={p.plan}
                className={cn(
                  'flex flex-col rounded-xl border bg-card p-6',
                  isCurrent && 'border-brand-primary ring-1 ring-brand-primary',
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">{p.label}</h3>
                  {p.note && (
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-500">
                      {p.note}
                    </span>
                  )}
                </div>
                <p className="mt-2">
                  <span className="font-heading text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-4 text-brand-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'outline' : 'brand'}
                  className="mt-6"
                  disabled={isCurrent || createSubscription.isPending}
                  onClick={() => createSubscription.mutate(p.plan)}
                >
                  {createSubscription.isPending && <Loader2 className="size-4 animate-spin" />}
                  {isCurrent ? 'Current plan' : 'Subscribe now'}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
