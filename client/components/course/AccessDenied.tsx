import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  courseSlug: string;
  courseTitle: string;
}

/** Overlay shown over the player when a lesson requires enrollment. */
export function AccessDenied({ courseSlug, courseTitle }: AccessDeniedProps): JSX.Element {
  return (
    <div className="relative aspect-video w-full overflow-hidden">
      {/* Blurred placeholder backdrop */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
        <span className="flex size-14 items-center justify-center rounded-full bg-white/10">
          <Lock className="size-7" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-bold">This lesson requires enrollment</h2>
          <p className="mt-1 text-sm text-white/70">
            You&apos;re viewing a preview of &ldquo;{courseTitle}&rdquo;.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="brand">
            <Link href={`/courses/${courseSlug}`}>Enroll now</Link>
          </Button>
          <Button asChild variant="outline" className="bg-transparent text-white hover:bg-white/10">
            <Link href="/subscription">Subscribe for $29/mo</Link>
          </Button>
        </div>
        <p className="text-xs text-white/60">Already enrolled? Make sure you&apos;re signed in.</p>
      </div>
    </div>
  );
}
