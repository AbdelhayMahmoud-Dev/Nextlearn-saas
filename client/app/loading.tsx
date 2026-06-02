import { Loader2 } from 'lucide-react';

/** Global route-transition fallback. */
export default function Loading(): JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-brand-primary" aria-label="Loading" />
    </div>
  );
}
