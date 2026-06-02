'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Retry handler; when omitted, no retry button is shown. */
  onRetry?: () => void;
}

/** Reusable error panel with an optional retry action. */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: ErrorStateProps): JSX.Element {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
    >
      <AlertTriangle className="mb-4 size-10 text-destructive" />
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
