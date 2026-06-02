'use client';

import { Menu } from 'lucide-react';
import { NotificationBell } from '@/components/common/NotificationBell';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useUiStore } from '@/store/uiStore';

interface InstructorTopBarProps {
  title?: string;
}

/**
 * Top bar for the instructor area: mobile hamburger, page title,
 * notification bell, and theme toggle.
 */
export function InstructorTopBar({ title }: InstructorTopBarProps): JSX.Element {
  const { toggleSidebar } = useUiStore();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open navigation menu"
        className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {title && (
        <h1 className="font-heading font-semibold text-base truncate hidden lg:block">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
