'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Role-area sidebar navigation with active-route highlighting. */
export function RoleSidebar({ title, items }: { title: string; items: NavItem[] }): JSX.Element {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r bg-card">
      <div className="p-4 font-heading text-lg font-bold">{title}</div>
      <nav className="space-y-1 px-2">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-brand-primary text-brand-primary-foreground' : 'hover:bg-accent',
              )}
            >
              <Icon className="size-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
