'use client';

import { Button } from '@/components/ui/button';

/** Admin dashboard error boundary. */
export default function AdminDashboardError({ reset }: { error: Error; reset: () => void }): JSX.Element {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="font-heading text-xl font-bold">Couldn&apos;t load the dashboard</h2>
      <p className="text-sm text-muted-foreground">Something went wrong fetching platform analytics.</p>
      <Button variant="brand" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
