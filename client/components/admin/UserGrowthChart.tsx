'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UserGrowthPoint } from '@/hooks/useAdminAnalytics';

/** Daily new-user registrations sparkline (last 30 days). */
export function UserGrowthChart({ data }: { data: UserGrowthPoint[] }): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(d: string) => d.slice(5)} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" width={28} />
        <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="count" name="New users" stroke="#8b5cf6" fill="url(#users)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
