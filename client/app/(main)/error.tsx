'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger';

/**
 * Segment-level error boundary for the (main) route group.
 * Catches errors thrown inside any (main) page or its layout without
 * blowing away the top-level shell (Navbar, footer, providers).
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    clientLogger.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="font-heading text-2xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button variant="brand" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
