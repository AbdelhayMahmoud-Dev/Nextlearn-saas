import { Loader2 } from 'lucide-react';

/** Loading state for the payment landing pages. */
export default function PaymentLoading(): JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-brand-primary" aria-label="Loading" />
    </div>
  );
}
