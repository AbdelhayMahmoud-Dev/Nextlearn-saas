'use client';

import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTenantStore } from '@/store/tenantStore';
import type { AuthUser } from '@/types';

/**
 * Mirrors the NextAuth session into the synchronous Zustand stores so the axios
 * interceptor can read the access token and tenant id without an async call.
 *
 * Also handles the `RefreshAccessTokenError` case: when the server-side JWT
 * callback cannot rotate the Express refresh token (e.g. the 7-day refresh
 * window has elapsed), NextAuth keeps the session alive but sets
 * `session.error = 'RefreshAccessTokenError'`. Without this check the user
 * appears logged in but every API call returns 401 indefinitely. We sign them
 * out immediately so they can re-authenticate.
 */
function AuthSync(): null {
  const { data: session } = useSession();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);
  const setTenant = useTenantStore((s) => s.setTenant);

  useEffect(() => {
    // Refresh token has expired or been revoked — force a clean sign-out so the
    // user can log in again rather than being stuck with a broken session.
    if (session?.error === 'RefreshAccessTokenError') {
      clear();
      void signOut({ redirect: true, callbackUrl: '/login' });
      return;
    }

    const sessionUser = session?.user;
    const user: AuthUser | null = sessionUser
      ? {
          id: sessionUser.id,
          name: sessionUser.name ?? '',
          email: sessionUser.email ?? '',
          role: sessionUser.role,
          tenantId: sessionUser.tenantId,
          isVerified: sessionUser.isVerified,
          avatar: sessionUser.image ?? undefined,
        }
      : null;

    setAuth(session?.accessToken ?? null, user);
    if (sessionUser?.tenantId) setTenant(sessionUser.tenantId);
  }, [session, setAuth, clear, setTenant]);

  return null;
}

/** NextAuth session provider + store hydration. */
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}
