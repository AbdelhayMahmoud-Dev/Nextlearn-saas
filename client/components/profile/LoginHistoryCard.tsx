'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLoginHistory } from '@/hooks/useSecurity';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { SECURITY_EVENT_LABELS, deviceLabel, isSecurityConcern } from '@/lib/security-format';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

/** Paginated history of the current user's security events. */
export function LoginHistoryCard(): JSX.Element {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useLoginHistory(page);

  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="font-heading text-lg font-semibold">Login &amp; security history</h3>

      {isLoading && <div className="skeleton h-40 w-full rounded-lg" />}
      {isError && <ErrorState title="Couldn't load history" onRetry={() => void refetch()} />}

      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">No history yet.</p>
      )}

      {data && data.items.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {data.items.map((e) => (
            <li key={e._id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="space-y-0.5">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isSecurityConcern(e.type) && 'text-destructive',
                  )}
                >
                  {SECURITY_EVENT_LABELS[e.type]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {deviceLabel(e.userAgent)} · {e.ip ?? 'Unknown IP'}
                </p>
              </div>
              <time className="shrink-0 text-xs text-muted-foreground" dateTime={e.createdAt}>
                {formatDate(e.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
              </time>
            </li>
          ))}
        </ul>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.meta.hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <span className="text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.meta.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
