import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

/** Centered, navless layout for the auth route group. */
export default function AuthLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-2xl font-bold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-primary text-brand-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        NextLearn
      </Link>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
