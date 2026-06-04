import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiErrorShape } from '@/types';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

/**
 * Shared axios instance for all browser → Express API calls.
 *
 * - Request: attaches `Authorization: Bearer <token>` (from authStore) and
 *   `x-tenant-id` (from tenantStore).
 * - Response: on a 401, asks NextAuth for a (possibly refreshed) session once,
 *   retries the original request, and signs out if it still fails. Errors are
 *   normalized to {@link ApiErrorShape}.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  const { tenantId } = useTenantStore.getState();
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  if (tenantId) config.headers.set('x-tenant-id', tenantId);
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface ServerErrorBody {
  message?: string;
  error?: Record<string, string[]>;
}

/**
 * Single-flight guard for the session refresh.
 *
 * Re-fetching the NextAuth session triggers its `jwt` callback, which rotates
 * the Express refresh token. The server applies refresh-token reuse detection:
 * presenting an already-rotated token revokes the entire token family. If N
 * requests 401 at once (the common case — a dashboard fires several queries in
 * parallel) and each calls `getSession()` independently, they each fetch
 * `/api/auth/session` and each runs the `jwt` callback with the *same* stale
 * refresh token — the first rotates it, the rest trip reuse detection and the
 * user is force-logged-out. Coalescing concurrent refreshes into one in-flight
 * `getSession()` ensures exactly one rotation per expiry.
 */
let sessionRefresh: Promise<string | undefined> | null = null;

function refreshAccessToken(): Promise<string | undefined> {
  if (!sessionRefresh) {
    sessionRefresh = getSession()
      .then((session) => (session as { accessToken?: string } | null)?.accessToken ?? undefined)
      .finally(() => {
        sessionRefresh = null;
      });
  }
  return sessionRefresh;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ServerErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status ?? 0;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        useAuthStore.getState().setAuth(refreshed, useAuthStore.getState().user);
        original.headers.set('Authorization', `Bearer ${refreshed}`);
        return apiClient(original);
      }
      await signOut({ redirect: false });
    }

    // No HTTP response at all (status 0) means the request never reached the
    // API: the server is down/unreachable, or the browser blocked the response
    // because the origin isn't in the backend's CORS allow-list. Axios reports
    // both as the opaque "Network Error" — replace it with an actionable hint.
    const isNetworkError = !error.response && error.code !== 'ERR_CANCELED';
    const message = isNetworkError
      ? `Cannot reach the server (${baseURL}). Check your connection, that the API is running, and that this site is allowed by the API's CORS configuration.`
      : (error.response?.data?.message ?? error.message ?? 'Request failed');

    const normalized: ApiErrorShape = {
      message,
      statusCode: status,
      fieldErrors: error.response?.data?.error,
    };
    return Promise.reject(normalized);
  },
);
