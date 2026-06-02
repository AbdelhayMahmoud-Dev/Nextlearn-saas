import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

/** Single KPI tile for the dashboard stats row. */
export function StatsCard({ icon: Icon, label, value }: StatsCardProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-heading text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
