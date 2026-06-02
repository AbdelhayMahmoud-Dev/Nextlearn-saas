import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** Global 404 page. */
export default function NotFound(): JSX.Element {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-7xl font-bold text-brand-primary">404</p>
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild variant="brand">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
