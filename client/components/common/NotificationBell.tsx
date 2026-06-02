'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useMarkAllRead, useNotifications, useUnreadCount } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { cn, timeAgo } from '@/lib/utils';

/** Navbar notification bell: unread badge + recent dropdown. */
export function NotificationBell(): JSX.Element {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const notifications = useNotifications();
  const markAll = useMarkAllRead();
  const recent = notifications.data?.pages[0]?.items.slice(0, 5) ?? [];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-medium">Notifications</span>
              {unread > 0 && (
                <button
                  className="text-xs text-brand-primary hover:underline"
                  onClick={() => markAll.mutate()}
                >
                  Mark all read
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</p>
            ) : (
              <ul className="max-h-80 divide-y overflow-y-auto">
                {recent.map((n) => (
                  <li key={n._id}>
                    <Link
                      href={n.link ?? '/notifications'}
                      onClick={() => setOpen(false)}
                      className={cn('block px-4 py-3 text-sm hover:bg-accent', !n.isRead && 'bg-brand-primary/5')}
                    >
                      <p className="font-medium leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t px-4 py-2 text-center text-sm font-medium text-brand-primary hover:bg-accent"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
