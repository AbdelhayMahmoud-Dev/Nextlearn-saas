'use client';

import { useState } from 'react';
import { PlusCircle, Video } from 'lucide-react';
import { LiveSessionCard } from '@/components/instructor/LiveSessionCard';
import { CreateLiveSessionDialog } from '@/components/instructor/CreateLiveSessionDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useInstructorLiveSessions } from '@/hooks/useInstructorLiveSessions';

/** Live session manager with tabbed view: upcoming / live now / past. */
export default function InstructorLivePage(): JSX.Element {
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'live' | 'ended'>('upcoming');
  const { data: sessions, isLoading, isError, refetch } = useInstructorLiveSessions();

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live Now' },
    { key: 'ended', label: 'Past' },
  ] as const;

  const filtered = sessions?.filter((s) =>
    tab === 'upcoming' ? s.status === 'scheduled' : s.status === tab,
  ) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
    );
  }
  if (isError) return <ErrorState title="Couldn't load sessions" onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Live Sessions</h1>
        <Button variant="brand" onClick={() => setShowCreate(true)}>
          <PlusCircle className="size-4 mr-2" /> Schedule Session
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? 'border-brand-primary text-brand-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
            {t.key === 'live' && sessions?.filter((s) => s.status === 'live').length ? (
              <span className="ml-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                {sessions.filter((s) => s.status === 'live').length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Video}
          title={`No ${tab === 'upcoming' ? 'upcoming' : tab === 'live' ? 'live' : 'past'} sessions`}
          description={tab === 'upcoming' ? 'Schedule a session to engage with your students live.' : ''}
          action={tab === 'upcoming' ? (
            <Button variant="brand" onClick={() => setShowCreate(true)}>
              Schedule Session
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <LiveSessionCard key={session._id} session={session} />
          ))}
        </div>
      )}

      {showCreate && <CreateLiveSessionDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}
