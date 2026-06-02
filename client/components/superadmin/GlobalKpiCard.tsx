import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

/** Compact KPI tile for the global analytics dashboard. */
export function GlobalKpiCard({ label, value, icon: Icon }: Props): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
    </div>
  );
}
