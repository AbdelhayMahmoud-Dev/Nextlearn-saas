'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { CATEGORIES, categoryHref } from '@/lib/categories';
import { Button } from '@/components/ui/button';

/** Hamburger menu that opens a full-height slide-in drawer (mobile only). */
export function MobileNav({ isAuthed }: { isAuthed: boolean }): JSX.Element {
  const [open, setOpen] = useState(false);
  const close = (): void => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/50"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-background p-6 shadow-xl"
              role="dialog"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={close}
                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
                <Link href="/courses" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                  All courses
                </Link>
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Categories
                </p>
                {CATEGORIES.map(({ name, slug, icon: Icon, bg, iconColor }) => (
                  <Link
                    key={slug}
                    href={categoryHref(slug)}
                    onClick={close}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    <span className={`flex size-7 items-center justify-center rounded-md ${bg} ${iconColor}`}>
                      <Icon className="size-4" />
                    </span>
                    {name}
                  </Link>
                ))}
              </nav>

              {!isAuthed && (
                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                  <Button asChild variant="ghost" onClick={close}>
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="brand" onClick={close}>
                    <Link href="/register">Get started</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
