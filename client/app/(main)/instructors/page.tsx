'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Star, Users } from 'lucide-react';
import { useInstructors } from '@/hooks/useMarketplace';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

export default function InstructorsPage(): JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const { data, isLoading } = useInstructors(page, debounced);

  return (
    <div className="container py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Instructors</h1>
      <p className="mt-1 text-muted-foreground">Learn from our community of expert educators.</p>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search instructors…"
          aria-label="Search instructors"
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)
          : data?.items.map((ins) => (
              <Link
                key={ins.id}
                href={`/instructors/${ins.id}`}
                className="flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-brand-primary"
              >
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                    {ins.avatar ? (
                      <Image src={ins.avatar} alt={ins.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-sm font-medium">
                        {getInitials(ins.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold">{ins.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {ins.avgRating.toFixed(1)} · {ins.courses} course{ins.courses === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                {ins.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{ins.bio}</p>}
                <p className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" /> {ins.students.toLocaleString('en-US')} students
                </p>
              </Link>
            ))}
      </div>

      {data && data.items.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">No instructors found.</p>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
