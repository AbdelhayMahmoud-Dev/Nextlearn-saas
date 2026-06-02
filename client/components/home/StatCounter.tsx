'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';

interface StatCounterProps {
  value: number;
  /** Appended after the number (e.g. "+"). */
  suffix?: string;
}

/** Count-up number that animates from 0 → `value` once it scrolls into view. */
export function StatCounter({ value, suffix = '+' }: StatCounterProps): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate(latest) {
        node.textContent = `${Math.round(latest).toLocaleString('en-US')}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}
