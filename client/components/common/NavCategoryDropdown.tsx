'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { CATEGORIES, categoryHref } from '@/lib/categories';

/** "Courses" nav item that reveals a category menu on hover/focus (desktop). */
export function NavCategoryDropdown(): JSX.Element {
  return (
    <div className="group relative">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Courses
        <ChevronDown className="size-4 transition-transform group-hover:rotate-180" aria-hidden="true" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="grid gap-1 rounded-xl border bg-popover p-2 shadow-lg">
          {CATEGORIES.map(({ name, slug, icon: Icon, bg, iconColor }) => (
            <Link
              key={slug}
              href={categoryHref(slug)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <span className={`flex size-7 items-center justify-center rounded-md ${bg} ${iconColor}`}>
                <Icon className="size-4" />
              </span>
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
