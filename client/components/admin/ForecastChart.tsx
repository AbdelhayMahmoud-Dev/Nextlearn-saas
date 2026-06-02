'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenueForecast } from '@/hooks/useAdminAdvancedAnalytics';

/** 12 months of actual revenue followed by a 3-month linear projection. */
export function ForecastChart({ data }: { data: RevenueForecast }): JSX.Element {
  const combined = [
    ...data.history.map((h) => ({ month: h.month, actual: h.revenue, projected: null as number | null })),
    ...data.forecast.map((f) => ({ month: f.month, actual: null as number | null, projected: f.revenue })),
  ];
  const boundary = data.history[data.history.length - 1]?.month;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={combined} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {boundary && <ReferenceLine x={boundary} stroke="#94a3b8" strokeDasharray="4 4" />}
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual ($)"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="projected"
          name="Projected ($)"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
