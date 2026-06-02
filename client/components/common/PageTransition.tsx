'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

/** Fades + lifts route content on navigation (transform/opacity only). */
export function PageTransition({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
