'use client';

import { Calendar, Video } from 'lucide-react';
import { useUpcomingSessions } from '@/hooks/useLiveSessions';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Upcoming live sessions for the student's enrolled courses (hidden when none). */
export function UpcomingSessions(): JSX.Element | null {
  const { data, isLoading } = useUpcomingSessions();
  const sessions = data ?? [];

  if (isLoading) return <div className="skeleton h-28 rounded-xl" />;
  if (sessions.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold">Upcoming live sessions</h2>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s._id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                <Calendar className="size-5" />
              </span>
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.course?.title} ·{' '}
                  {formatDate(s.scheduledAt, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {s.meetingUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="size-4" /> Join
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
