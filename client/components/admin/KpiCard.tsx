import { ArrowDownRight, ArrowUpRight, type LucideIcon, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
}

/** Single KPI tile: value, label, icon, and a colored change badge. */
export function KpiCard({ label, value, change, changeLabel = 'vs last month', icon: Icon }: KpiCardProps): JSX.Element {
  const hasChange = typeof change === 'number';
  const up = (change ?? 0) > 0;
  const down = (change ?? 0) < 0;
  const TrendIcon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
      {hasChange && (
        <p
          className={cn(
            'mt-1 inline-flex items-center gap-1 text-xs font-medium',
            up && 'text-green-500',
            down && 'text-red-500',
            !up && !down && 'text-muted-foreground',
          )}
        >
          <TrendIcon className="size-3.5" />
          {Math.abs(change ?? 0)}% <span className="text-muted-foreground">{changeLabel}</span>
        </p>
      )}
    </div>
  );
}
