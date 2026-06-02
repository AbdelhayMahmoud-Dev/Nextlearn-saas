import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Stripe Checkout cancel landing. */
export default function PaymentCancelPage(): JSX.Element {
  return (
    <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <XCircle className="size-9" />
      </span>
      <h1 className="font-heading text-3xl font-bold">Payment cancelled</h1>
      <p className="text-muted-foreground">
        Your payment was not processed and you have not been charged.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="brand" size="lg">
          <Link href="/courses">Go back to courses</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="mailto:support@nextlearn.com">Contact support</a>
        </Button>
      </div>
    </div>
  );
}
