'use client';

import { CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useCreateConnectAccount,
  useGetLoginLink,
  useGetOnboardingLink,
  useStripeConnect,
} from '@/hooks/useStripeConnect';

/** Stripe Connect onboarding/status panel for tenant admins. */
export function StripeConnectPanel(): JSX.Element {
  const { data, isLoading, refetch, isRefetching } = useStripeConnect();
  const createAccount = useCreateConnectAccount();
  const onboarding = useGetOnboardingLink();
  const login = useGetLoginLink();

  if (isLoading || !data) {
    return <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>;
  }

  const refreshBtn = (
    <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isRefetching}>
      <RefreshCw className={isRefetching ? 'size-4 animate-spin' : 'size-4'} /> Refresh status
    </Button>
  );

  // State 3 — active
  if (data.stripeOnboardingComplete) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-green-500">
          <CheckCircle2 className="size-5" /> Stripe Connect active
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Account: <span className="font-mono">{data.stripeAccountId}</span></p>
        <p className="text-sm text-muted-foreground">Status: Verified · Payouts: Enabled</p>
        <p className="mt-2 text-sm">Platform fee: <strong>20%</strong> · Your share: <strong>80%</strong></p>
        <div className="mt-4 flex gap-2">
          <Button variant="brand" onClick={() => login.mutate()} disabled={login.isPending}>
            {login.isPending && <Loader2 className="size-4 animate-spin" />} Open Stripe dashboard <ExternalLink className="size-4" />
          </Button>
          {refreshBtn}
        </div>
      </div>
    );
  }

  // State 2 — created, onboarding incomplete
  if (data.stripeAccountId) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-amber-500">
          <TriangleAlert className="size-5" /> Onboarding required
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Complete Stripe verification to start receiving payouts.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="brand" onClick={() => onboarding.mutate()} disabled={onboarding.isPending}>
            {onboarding.isPending && <Loader2 className="size-4 animate-spin" />} Complete Stripe onboarding →
          </Button>
          {refreshBtn}
        </div>
      </div>
    );
  }

  // State 1 — not connected
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <CreditCard className="size-5 text-brand-primary" /> Stripe Connect
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Connect your Stripe account to receive payouts from course sales directly to your bank.
      </p>
      <Button
        variant="brand"
        className="mt-4"
        onClick={() => createAccount.mutate(undefined, {
          onSuccess: () => { toast.success('Account created — continue with onboarding'); onboarding.mutate(); },
          onError: (e) => toast.error(e.message),
        })}
        disabled={createAccount.isPending}
      >
        {createAccount.isPending && <Loader2 className="size-4 animate-spin" />} Connect with Stripe →
      </Button>
    </div>
  );
}
