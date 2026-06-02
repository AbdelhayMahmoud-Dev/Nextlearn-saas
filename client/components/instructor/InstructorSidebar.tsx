'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  PlusCircle,
  Users,
  Video,
  ChevronLeft,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/uiStore';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', href: '/instructor/courses', icon: BookOpen },
  { label: 'Create Course', href: '/instructor/courses/create', icon: PlusCircle },
  { label: 'Students', href: '/instructor/students', icon: Users },
  { label: 'Assignments', href: '/instructor/assignments', icon: ClipboardList },
  { label: 'Live Sessions', href: '/instructor/live', icon: Video },
  { label: 'Earnings', href: '/instructor/earnings', icon: DollarSign },
] as const;

/**
 * Collapsible sidebar for the instructor area.
 * Collapsed on desktop: icon-only (40px). On mobile: hidden (see InstructorLayout).
 */
export function InstructorSidebar(): JSX.Element {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const collapsed = !sidebarOpen;

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-200',
        collapsed ? 'w-14' : 'w-60',
      )}
      aria-label="Instructor navigation"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <GraduationCap className="size-5 shrink-0 text-brand-primary" />
            <span className="truncate text-sm font-semibold">Instructor Studio</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed && 'mx-auto',
          )}
        >
          <ChevronLeft className={cn('size-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3" aria-label="Instructor menu">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-brand-primary/10 text-brand-primary font-medium border-l-2 border-brand-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
