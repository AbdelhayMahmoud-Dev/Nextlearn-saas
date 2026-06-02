import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

/** Read-only star rating (renders 5 stars with a half-step fill via clipping). */
export function StarRating({ value, count, size = 14, className }: StarRatingProps): JSX.Element {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => {
          const fillPct = Math.max(0, Math.min(1, rounded - (i - 1))) * 100;
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star className="absolute inset-0 text-muted-foreground/40" style={{ width: size, height: size }} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPct}%` }}>
                <Star
                  className="text-amber-400"
                  style={{ width: size, height: size }}
                  fill="currentColor"
                />
              </span>
            </span>
          );
        })}
      </span>
      <span className="text-xs font-medium">{value.toFixed(1)}</span>
      {typeof count === 'number' && (
        <span className="text-xs text-muted-foreground">({count.toLocaleString('en-US')})</span>
      )}
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{typeof count === 'number' ? ` from ${count} reviews` : ''}
      </span>
    </span>
  );
}
