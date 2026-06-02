'use client';

import { useCallback, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const PRICES = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
] as const;
const SORTS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
] as const;

interface CourseFiltersProps {
  categories: { name: string; count: number }[];
}

/** URL-synced catalog filters (search, category, level, price, sort). */
export function CourseFilters({ categories }: CourseFiltersProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== params.get(key)) next.set(key, value);
      else next.delete(key);
      next.delete('page'); // any filter change resets pagination
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const onSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q');
    setParam('q', typeof value === 'string' && value.trim() ? value.trim() : undefined);
  };

  const get = (key: string): string => params.get(key) ?? '';
  const hasFilters = ['q', 'category', 'level', 'price'].some((k) => params.get(k));

  const toggle = (key: string, value: string): void =>
    setParam(key, get(key) === value ? undefined : value);

  return (
    <div className="space-y-6">
      <form onSubmit={onSearch} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={get('q')} placeholder="Search courses…" className="pl-9" aria-label="Search courses" />
      </form>

      <div className="space-y-2">
        <label htmlFor="sort" className="text-sm font-medium">
          Sort by
        </label>
        <select
          id="sort"
          value={get('sort') || 'popular'}
          onChange={(e) => setParam('sort', e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Category</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => toggle('category', c.name)}
              aria-pressed={get('category') === c.name}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                get('category') === c.name
                  ? 'border-brand-primary bg-brand-primary text-brand-primary-foreground'
                  : 'hover:bg-accent',
              )}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Level</legend>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => toggle('level', level)}
              aria-pressed={get('level') === level}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                get('level') === level ? 'border-brand-primary bg-brand-primary text-brand-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Price</legend>
        <div className="flex flex-wrap gap-2">
          {PRICES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => toggle('price', p.value)}
              aria-pressed={get('price') === p.value}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                get('price') === p.value ? 'border-brand-primary bg-brand-primary text-brand-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)} className="text-muted-foreground">
          <X className="size-4" /> Clear all filters
        </Button>
      )}
    </div>
  );
}
