import { StripeConnectPanel } from '@/components/admin/StripeConnectPanel';

/** Admin payouts (Stripe Connect) settings page. */
export default function AdminStripePage(): JSX.Element {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold">Payouts</h1>
        <p className="text-sm text-muted-foreground">Connect Stripe to receive your share of course sales.</p>
      </div>
      <StripeConnectPanel />
    </div>
  );
}
