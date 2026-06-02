'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { NavCategoryDropdown } from './NavCategoryDropdown';
import { MobileNav } from './MobileNav';

/** Top navigation: auth-aware, sticky, transparent at top → blurred on scroll. */
export function Navbar(): JSX.Element {
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated' && Boolean(session?.user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-brand-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          NextLearn
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavCategoryDropdown />
          <Link href="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Marketplace
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthed ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/assistant" aria-label="Learning assistant">
                  <Sparkles className="size-4" /> Assistant
                </Link>
              </Button>
              <NotificationBell />
              <Button asChild variant="brand" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="brand" size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}
          <MobileNav isAuthed={isAuthed} />
        </div>
      </div>
    </header>
  );
}
