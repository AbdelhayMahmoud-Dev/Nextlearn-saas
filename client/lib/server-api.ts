const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

// Loud, one-time diagnostics in the server log (Vercel functions). A homepage
// that renders empty in production is almost always one of these two misconfigs;
// surfacing them here turns a silent empty page into an actionable log line.
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    console.error(
      '[server-api] NEXT_PUBLIC_API_URL is not set in production — falling back to localhost, ' +
        'which is unreachable on the server. Set it to your Railway API URL (…/api/v1).',
    );
  }
  if (!TENANT_ID) {
    console.error(
      '[server-api] NEXT_PUBLIC_TENANT_ID is empty — tenant-scoped endpoints (stats, courses, ' +
        'categories, reviews) will 404. Set it to the production tenant id.',
    );
  }
}

/** Error thrown by {@link serverGet} carrying the HTTP status. */
export class ServerApiError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ServerApiError';
    this.statusCode = statusCode;
  }
}

interface ServerGetOptions {
  /** ISR revalidation window in seconds (default 60). Pass 0 for no cache. */
  revalidate?: number;
}

/**
 * Server-side GET against the Express API, with the tenant header attached.
 * For use in Server Components / generateMetadata (public, unauthenticated reads).
 */
export async function serverGet<T>(path: string, options: ServerGetOptions = {}): Promise<T> {
  const revalidate = options.revalidate ?? 60;
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT_ID },
    ...(revalidate === 0 ? { cache: 'no-store' } : { next: { revalidate } }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    const message = body?.message ?? `Request failed (${res.status})`;
    // Server-side log so production fetch failures are visible (the homepage's
    // safe() wrapper otherwise swallows these into empty fallbacks).
    console.error(`[server-api] GET ${API_URL}${path} → ${res.status}: ${message}`);
    throw new ServerApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}
