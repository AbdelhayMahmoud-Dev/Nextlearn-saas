import Link from 'next/link';
import { CATEGORIES, categoryHref } from '@/lib/categories';

interface CategoryGridProps {
  /** Published-course counts keyed by category slug (from `/courses/categories`). */
  counts?: Record<string, number>;
}

/** Category navigation grid → filtered catalog, with per-category color themes + counts. */
export function CategoryGrid({ counts = {} }: CategoryGridProps): JSX.Element {
  return (
    <section className="container py-16">
      <h2 className="text-center font-heading text-3xl font-bold">Browse by category</h2>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map(({ name, slug, icon: Icon, bg, iconColor }) => {
          const count = counts[slug] ?? 0;
          return (
            <Link
              key={slug}
              href={categoryHref(slug)}
              className="group relative flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-brand-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {count > 0 && (
                <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {count.toLocaleString('en-US')}
                </span>
              )}
              <span
                className={`flex size-12 items-center justify-center rounded-lg transition-colors ${bg} ${iconColor} group-hover:brightness-125`}
              >
                <Icon className="size-6" />
              </span>
              <span className="font-medium group-hover:text-brand-primary">{name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
