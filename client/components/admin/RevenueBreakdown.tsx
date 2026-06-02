import { formatPrice } from '@/lib/utils';
import type { CategoryRow } from '@/hooks/useAdminAnalytics';

/** Revenue contribution by category (sorted desc). */
export function RevenueBreakdown({ data }: { data: CategoryRow[] }): JSX.Element {
  const rows = [...data].sort((a, b) => b.revenue - a.revenue);
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Total revenue: <span className="font-medium text-foreground">{formatPrice(total)}</span></p>
      {rows.map((r) => (
        <div key={r.category} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
          <span>{r.category} <span className="text-xs text-muted-foreground">({r.courseCount} courses)</span></span>
          <span className="font-medium">{formatPrice(r.revenue)}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No revenue data.</p>}
    </div>
  );
}
