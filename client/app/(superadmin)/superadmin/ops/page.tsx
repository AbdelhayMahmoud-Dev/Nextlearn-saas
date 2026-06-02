'use client';

import { CheckCircle2, CircleSlash, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { useOpsStatus, type ComponentStatus } from '@/hooks/useOps';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<ComponentStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { label: 'Operational', className: 'text-emerald-600', Icon: CheckCircle2 },
  degraded: { label: 'Degraded', className: 'text-amber-600', Icon: AlertTriangle },
  down: { label: 'Down', className: 'text-destructive', Icon: XCircle },
  disabled: { label: 'Disabled', className: 'text-muted-foreground', Icon: CircleSlash },
};

function StatusBadge({ status }: { status: ComponentStatus }): JSX.Element {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', s.className)}>
      <s.Icon className="size-4" /> {s.label}
    </span>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d ? `${d}d` : '', h ? `${h}h` : '', `${m}m`].filter(Boolean).join(' ');
}

export default function OpsPage(): JSX.Element {
  const { data, isLoading, isError } = useOpsStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-primary" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-sm text-destructive">Failed to load operational status.</p>;
  }

  const components = [
    { key: 'database', label: 'Database (MongoDB)', ...data.components.database },
    { key: 'redis', label: 'Cache (Redis)', ...data.components.redis },
    { key: 'email', label: 'Email (Resend)', ...data.components.email },
    { key: 'stripe', label: 'Payments (Stripe)', ...data.components.stripe },
    { key: 'ai', label: 'AI Assistant', ...data.components.ai },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Operations</h1>
        <div className="flex items-center gap-3 text-sm">
          <StatusBadge status={data.overall} />
          <span className="text-muted-foreground">
            Updated {new Date(data.generatedAt).toLocaleTimeString('en-US')}
          </span>
        </div>
      </div>

      {/* Server */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Uptime', value: formatUptime(data.server.uptimeSeconds) },
          { label: 'Environment', value: data.server.environment },
          { label: 'Node', value: data.server.nodeVersion },
          {
            label: 'Memory (heap)',
            value: `${data.server.memory.heapUsedMb} / ${data.server.memory.heapTotalMb} MB`,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="font-heading text-lg font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Components */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Services</h2>
        <div className="divide-y">
          {components.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.detail}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </section>

      {/* Jobs */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold">Scheduled jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Job</th>
                <th className="py-2 font-medium">Schedule</th>
                <th className="py-2 font-medium">Last run</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Runs</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((j) => (
                <tr key={j.name} className="border-t">
                  <td className="py-2">
                    {j.name}
                    <div className="text-xs text-muted-foreground">{j.description}</div>
                  </td>
                  <td className="py-2 font-mono text-xs">{j.schedule}</td>
                  <td className="py-2 text-muted-foreground">
                    {j.lastRunAt ? new Date(j.lastRunAt).toLocaleString('en-US') : 'Not yet run'}
                  </td>
                  <td className="py-2 capitalize">
                    {j.status === 'failed' ? (
                      <span className="text-destructive" title={j.lastError ?? undefined}>
                        failed
                      </span>
                    ) : (
                      j.status
                    )}
                  </td>
                  <td className="py-2">
                    {j.runCount}
                    {j.failureCount > 0 && (
                      <span className="text-destructive"> ({j.failureCount} failed)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
