'use client';

import { toast } from 'sonner';
import { Radio, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { useStartSession, useEndSession, useCancelSession } from '@/hooks/useInstructorLiveSessions';
import type { ILiveSession } from '@/types';

const STATUS_STYLES = {
  scheduled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse',
  ended: 'bg-muted text-muted-foreground',
};

interface Props {
  session: ILiveSession;
}

/** Single live session card with contextual actions. */
export function LiveSessionCard({ session }: Props): JSX.Element {
  const start = useStartSession(session._id);
  const end = useEndSession(session._id);
  const cancel = useCancelSession();

  const handleStart = async (): Promise<void> => {
    if (!window.confirm('Start this session? All enrolled students will be notified.')) return;
    await start.mutateAsync().then(() => toast.success('Session started — students notified!')).catch(() => toast.error('Failed to start session'));
  };

  const handleEnd = async (): Promise<void> => {
    await end.mutateAsync().then(() => toast.success('Session ended')).catch(() => toast.error('Failed to end session'));
  };

  const handleCancel = async (): Promise<void> => {
    if (!window.confirm('Cancel this session?')) return;
    await cancel.mutateAsync(session._id).then(() => toast.success('Session cancelled')).catch(() => toast.error('Failed to cancel session'));
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />
            <h3 className="font-semibold truncate">{session.title}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" /> {formatDate(session.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {session.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" /> {session.attendees.length} attendees
            </span>
          </div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[session.status])}>
          {session.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {session.status === 'scheduled' && (
          <>
            <Button type="button" variant="brand" size="sm" onClick={() => void handleStart()} disabled={start.isPending}>
              Start Session →
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={cancel.isPending}>
              Cancel
            </Button>
          </>
        )}
        {session.status === 'live' && (
          <>
            {session.meetingUrl && (
              <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                Join <ExternalLink className="size-3.5" />
              </a>
            )}
            <Button type="button" variant="destructive" size="sm" onClick={() => void handleEnd()} disabled={end.isPending}>
              End Session
            </Button>
          </>
        )}
        {session.status === 'ended' && (
          <p className="text-xs text-muted-foreground">Session ended · {session.attendees.length} students attended</p>
        )}
      </div>
    </div>
  );
}
