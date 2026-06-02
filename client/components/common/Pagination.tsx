'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
}

/** URL-synced pagination control (preserves existing query params). */
export function Pagination({ page, totalPages }: PaginationProps): JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (target: number): void => {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(target));
    router.push(`${pathname}?${next.toString()}`);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => goTo(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, index) => {
        const prev = pages[index - 1];
        const gap = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-muted-foreground">…</span>}
            <Button
              variant={p === page ? 'brand' : 'outline'}
              size="icon"
              onClick={() => goTo(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          </span>
        );
      })}
      <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => goTo(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
