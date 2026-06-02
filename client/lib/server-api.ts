const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

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
    throw new ServerApiError(body?.message ?? `Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}
