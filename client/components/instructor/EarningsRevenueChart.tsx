'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ChartPoint {
  month: string;
  oneTime: number;
  subscription: number;
}

interface Props {
  data: ChartPoint[];
}

/** Grouped bar chart showing one-time vs subscription revenue per month. */
export function EarningsRevenueChart({ data }: Props): JSX.Element {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No revenue data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(v: number, name: string) => [`$${v}`, name === 'oneTime' ? 'One-time' : 'Subscription']}
        />
        <Legend formatter={(v) => (v === 'oneTime' ? 'One-time' : 'Subscription')} />
        <Bar dataKey="oneTime" fill="hsl(var(--brand-primary))" radius={[3, 3, 0, 0]} />
        <Bar dataKey="subscription" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
