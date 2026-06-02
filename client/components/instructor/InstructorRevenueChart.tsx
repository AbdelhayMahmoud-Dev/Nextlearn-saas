'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { RevenueChartPoint } from '@/hooks/useInstructorAnalytics';

interface Props {
  data: RevenueChartPoint[];
}

/**
 * Dual-axis area chart: revenue (left, $) + enrollments (right, count).
 * Both rendered as area series with the same x-axis (month).
 */
export function InstructorRevenueChart({ data }: Props): JSX.Element {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No data yet — start enrolling students!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--brand-primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2, 217 91% 60%))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2, 217 91% 60%))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          orientation="left"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          yAxisId="enrollments"
          orientation="right"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: number, name: string) =>
            name === 'revenue' ? [`$${value}`, 'Revenue'] : [value, 'Enrollments']
          }
        />
        <Legend />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--brand-primary))"
          fill="url(#colorRevenue)"
          strokeWidth={2}
        />
        <Area
          yAxisId="enrollments"
          type="monotone"
          dataKey="enrollments"
          stroke="hsl(217 91% 60%)"
          fill="url(#colorEnroll)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
