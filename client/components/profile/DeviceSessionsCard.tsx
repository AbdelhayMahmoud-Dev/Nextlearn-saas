'use client';

import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, MonitorSmartphone } from 'lucide-react';
import { useDeviceSessions, useRevokeSession, useRevokeOtherSessions } from '@/hooks/useSecurity';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { deviceLabel } from '@/lib/security-format';
import { formatDate, timeAgo } from '@/lib/utils';

/** Lists the user's active device sessions with per-session + bulk revoke. */
export function DeviceSessionsCard(): JSX.Element {
  const { data: sessions, isLoading, isError, refetch } = useDeviceSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  const onRevoke = (id: string): void => {
    revoke.mutate(id, {
      onSuccess: () => toast.success('Session revoked'),
      onError: (e) => toast.error(e.message),
    });
  };

  const onRevokeOthers = (): void => {
    revokeOthers.mutate(undefined, {
      onSuccess: () => toast.success('Signed out of other devices'),
      onError: (e) => toast.error(e.message),
    });
  };

  const onSignOutAll = (): void => {
    revokeOthers.mutate(undefined, {
      onSuccess: async () => {
        toast.success('Signed out everywhere');
        await signOut({ callbackUrl: '/login' });
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const hasOthers = (sessions ?? []).some((s) => !s.isCurrent);

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-heading text-lg font-semibold">Active sessions</h3>
        {hasOthers && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRevokeOthers}
            disabled={revokeOthers.isPending}
          >
            {revokeOthers.isPending && <Loader2 className="size-4 animate-spin" />} Sign out other
            devices
          </Button>
        )}
      </div>

      {isLoading && <div className="skeleton h-24 w-full rounded-lg" />}
      {isError && <ErrorState title="Couldn't load sessions" onRetry={() => void refetch()} />}

      {sessions && sessions.length === 0 && (
        <p className="text-sm text-muted-foreground">No active sessions.</p>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex items-start gap-3">
                <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="space-y-0.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {deviceLabel(s.userAgent)}
                    {s.isCurrent && (
                      <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.ip ?? 'Unknown IP'} · Active {timeAgo(s.lastSeenAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Signed in {formatDate(s.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRevoke(s.id)}
                  disabled={revoke.isPending}
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" onClick={onSignOutAll} disabled={revokeOthers.isPending}>
        Sign out on all devices
      </Button>
    </div>
  );
}
