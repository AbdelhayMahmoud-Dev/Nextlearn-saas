'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import {
  useAuditLogs,
  useSecurityEvents,
  type SecurityEventType,
} from '@/hooks/useSecurity';
import {
  SECURITY_EVENT_LABELS,
  deviceLabel,
  formatAuditAction,
  isSecurityConcern,
} from '@/lib/security-format';

type Tab = 'events' | 'audit';

const EVENT_TYPES: SecurityEventType[] = [
  'login_success',
  'login_failed',
  'logout',
  'password_changed',
  'password_reset',
  'session_revoked',
  'token_reuse',
  'suspicious_activity',
];

function Pager({
  meta,
  onPrev,
  onNext,
}: {
  meta: { page: number; totalPages: number; hasPrev: boolean; hasNext: boolean };
  onPrev: () => void;
  onNext: () => void;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={onPrev}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}

export default function AdminSecurityPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('events');
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');

  const events = useSecurityEvents({ page, type: type || undefined });
  const audit = useAuditLogs({ page });

  const switchTab = (next: Tab): void => {
    setTab(next);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold">Security</h1>
        <p className="text-sm text-muted-foreground">
          Authentication events and a privileged-action audit trail for your tenant.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border bg-card p-1">
          {(
            [
              ['events', 'Security events'],
              ['audit', 'Audit log'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium',
                tab === id
                  ? 'bg-brand-primary text-brand-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'events' && (
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            aria-label="Event type"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All event types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {SECURITY_EVENT_LABELS[t]}
              </option>
            ))}
          </select>
        )}
      </div>

      {tab === 'events' ? (
        events.isError ? (
          <ErrorState title="Couldn't load security events" onRetry={() => void events.refetch()} />
        ) : events.isLoading || !events.data ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-brand-primary" />
          </div>
        ) : events.data.items.length === 0 ? (
          <p className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
            No security events recorded.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Device</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                    <th className="px-4 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {events.data.items.map((e) => (
                    <tr key={e._id} className="border-b last:border-0">
                      <td
                        className={cn(
                          'px-4 py-3 font-medium',
                          isSecurityConcern(e.type) && 'text-destructive',
                        )}
                      >
                        {SECURITY_EVENT_LABELS[e.type]}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{e.email ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{deviceLabel(e.userAgent)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.ip ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(e.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              meta={events.data.meta}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )
      ) : audit.isError ? (
        <ErrorState title="Couldn't load audit log" onRetry={() => void audit.refetch()} />
      ) : audit.isLoading || !audit.data ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-brand-primary" />
        </div>
      ) : audit.data.items.length === 0 ? (
        <p className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
          No audit entries recorded.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.items.map((l) => (
                  <tr key={l._id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{formatAuditAction(l.action)}</td>
                    <td className="px-4 py-3">
                      {l.actor?.name ?? '—'}
                      <div className="text-xs text-muted-foreground">{l.actor?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {l.targetType ? `${l.targetType} ${l.targetId ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.ip ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(l.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            meta={audit.data.meta}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}
