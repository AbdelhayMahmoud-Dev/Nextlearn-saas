'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/**
 * Google OAuth sign-in button. Deferred in Phase 2 (no Express Google flow yet),
 * so it's rendered disabled with a clear "coming soon" affordance. Phase 4 wires
 * it to NextAuth's Google provider + an Express find-or-create endpoint.
 */
export function GoogleButton(): JSX.Element {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => toast.info('Google sign-in is coming soon.')}
      aria-label="Continue with Google (coming soon)"
    >
      <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.24 10.4V14h5.04c-.22 1.18-.9 2.18-1.92 2.85v2.37h3.1c1.82-1.67 2.87-4.14 2.87-7.07 0-.66-.06-1.3-.17-1.9z"
        />
        <path
          fill="currentColor"
          d="M12.24 22c2.43 0 4.47-.8 5.96-2.18l-3.1-2.37c-.86.58-1.96.92-2.86.92-2.2 0-4.06-1.48-4.72-3.48H4.34v2.44A8.99 8.99 0 0 0 12.24 22z"
        />
        <path
          fill="currentColor"
          d="M7.52 13.89a5.4 5.4 0 0 1 0-3.46V7.99H4.34a9 9 0 0 0 0 8.05l3.18-2.15z"
        />
        <path
          fill="currentColor"
          d="M12.24 6.96c1.32 0 2.5.45 3.43 1.35l2.57-2.57C16.7 4.3 14.66 3.5 12.24 3.5A8.99 8.99 0 0 0 4.34 7.99l3.18 2.44c.66-2 2.52-3.47 4.72-3.47z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
