'use client';

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RevenuePoint } from '@/hooks/useAdminAnalytics';

/** Revenue / enrollments / subscriptions over the last 12 months. */
export function AdminRevenueChart({ data }: { data: RevenuePoint[] }): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#6366f1" fill="url(#rev)" strokeWidth={2} />
        <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#22c55e" fillOpacity={0} strokeWidth={2} />
        <Area type="monotone" dataKey="subscriptions" name="Subscriptions" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
