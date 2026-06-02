'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger';

export default function InstructorDashboardError({
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
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="font-heading text-xl font-semibold">Dashboard error</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
      <Button variant="brand" onClick={reset}>
        Reload dashboard
      </Button>
    </div>
  );
}
