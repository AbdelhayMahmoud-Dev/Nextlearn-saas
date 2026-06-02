'use client';

import { useEffect, useRef } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import {
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { cn, timeAgo } from '@/lib/utils';

function groupOf(iso: string): string {
  const d = new Date(iso);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 7);
  if (d >= startToday) return 'Today';
  if (d >= startYesterday) return 'Yesterday';
  if (d >= startWeek) return 'This Week';
  return 'Earlier';
}

export default function NotificationsPage(): JSX.Element {
  const query = useNotifications();
  const markAll = useMarkAllRead();
  const markRead = useMarkNotificationRead();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  let lastGroup = '';

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Notifications</h1>
        {items.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title="Couldn't load notifications" onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const group = groupOf(n.createdAt);
            const header = group !== lastGroup ? group : null;
            lastGroup = group;
            return (
              <li key={n._id}>
                {header && (
                  <p className="px-1 pb-1 pt-4 text-xs font-semibold uppercase text-muted-foreground">
                    {header}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => !n.isRead && markRead.mutate(n._id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !n.isRead && 'border-brand-primary/30 bg-brand-primary/5',
                  )}
                >
                  {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-primary" />}
                  <div className={cn('min-w-0 flex-1', n.isRead && 'pl-5')}>
                    <p className="font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinel} className="h-8" />
      {query.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
