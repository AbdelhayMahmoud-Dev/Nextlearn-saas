import { cn } from '@/lib/utils';
import type { CategoryRow } from '@/hooks/useAdminAnalytics';

/** Horizontal bars of enrollments by category. */
export function EnrollmentHeatmap({ data }: { data: CategoryRow[] }): JSX.Element {
  const max = Math.max(1, ...data.map((d) => d.enrollments));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.category}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium">{d.category}</span>
            <span className="text-muted-foreground">{d.enrollments.toLocaleString('en-US')}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full bg-brand-primary')} style={{ width: `${(d.enrollments / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-muted-foreground">No enrollment data.</p>}
    </div>
  );
}
