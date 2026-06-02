/**
 * Minimal client-side logger — the single place client error reporting lives,
 * so it can be wired to a service (Sentry/LogRocket) without touching feature
 * code. Mirrors the server's `logger` pattern: components call this, never
 * `console` directly. No-ops in production.
 */
export const clientLogger = {
  error(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
  },
};
