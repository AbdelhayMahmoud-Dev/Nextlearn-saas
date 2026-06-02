'use client';

import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay in milliseconds.
 * Returns the debounced value that only updates after the delay has elapsed
 * without the input value changing.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
