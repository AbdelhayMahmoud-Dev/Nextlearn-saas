'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger';

/**
 * Segment-level error boundary for the /learn route.
 * Catches errors in the course player or curriculum sidebar without
 * destroying the outer application shell.
 */
export default function LearnError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="font-heading text-xl font-semibold">Player error</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message || 'This lesson couldn’t be loaded. Please try again.'}
      </p>
      <Button variant="brand" onClick={reset}>
        Reload player
      </Button>
    </div>
  );
}
