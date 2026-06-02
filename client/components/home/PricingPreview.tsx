'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Billing = 'monthly' | 'annual';

interface Plan {
  name: string;
  highlighted: boolean;
  /** Per-period price in USD; null = free. */
  price: Record<Billing, number> | null;
  cta: string;
}

const PLANS: Plan[] = [
  { name: 'Free', highlighted: false, price: null, cta: 'Get started' },
  { name: 'Pro', highlighted: true, price: { monthly: 29, annual: 199 }, cta: 'Start Pro' },
];

/** Features compared across plans (true = included). */
const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: 'Access free courses', free: true, pro: true },
  { label: 'Track your progress', free: true, pro: true },
  { label: 'Community support', free: true, pro: true },
  { label: 'All premium courses', free: false, pro: true },
  { label: 'Certificates of completion', free: false, pro: true },
  { label: 'Priority support', free: false, pro: true },
  { label: 'Early access to new courses', free: false, pro: true },
];

function FeatureRow({ label, included }: { label: string; included: boolean }): JSX.Element {
  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="size-4 shrink-0 text-green-500" />
      ) : (
        <Minus className="size-4 shrink-0 text-muted-foreground/50" />
      )}
      <span className={cn(!included && 'text-muted-foreground/60')}>{label}</span>
    </li>
  );
}

/** Pricing preview with a Monthly/Annual billing toggle. */
export function PricingPreview(): JSX.Element {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <section id="pricing" className="scroll-mt-20 bg-muted/30 py-16">
      <div className="container">
        <h2 className="text-center font-heading text-3xl font-bold">Simple, transparent pricing</h2>

        {/* Billing toggle */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="inline-flex rounded-full border bg-card p-1" role="tablist" aria-label="Billing period">
            {(['monthly', 'annual'] as const).map((period) => (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={billing === period}
                onClick={() => setBilling(period)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                  billing === period
                    ? 'bg-brand-primary text-brand-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {period}
              </button>
            ))}
          </div>
          {billing === 'annual' && (
            <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-500">
              Save 43%
            </span>
          )}
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const isPro = plan.price !== null;
            const amount = plan.price ? plan.price[billing] : 0;
            const perMonth = plan.price ? plan.price.annual / 12 : 0;
            return (
              <div
                key={plan.name}
                className={cn(
                  'flex flex-col rounded-xl border bg-card p-6',
                  plan.highlighted && 'popular-glow border-brand-primary',
                )}
              >
                {plan.highlighted && (
                  <span className="mb-2 self-start rounded-full bg-brand-primary px-2.5 py-0.5 text-xs font-medium text-brand-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2">
                  <span className="font-heading text-3xl font-bold">
                    ${amount.toLocaleString('en-US')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isPro ? (billing === 'monthly' ? '/month' : '/year') : ' forever'}
                  </span>
                </p>
                {isPro && billing === 'annual' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ${perMonth.toFixed(2)}/month, billed annually
                  </p>
                )}
                <ul className="mt-5 flex-1 space-y-2">
                  {FEATURES.map((f) => (
                    <FeatureRow key={f.label} label={f.label} included={plan.name === 'Free' ? f.free : f.pro} />
                  ))}
                </ul>
                <Button asChild variant={plan.highlighted ? 'brand' : 'outline'} className="mt-6">
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
