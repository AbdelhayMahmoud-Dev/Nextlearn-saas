import { create } from 'zustand';
import type { AuthUser } from '@/types';

interface AuthState {
  /** Express access token, mirrored from the NextAuth session for sync reads. */
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string | null, user: AuthUser | null) => void;
  clear: () => void;
}

/**
 * Synchronous cache of the authenticated session. The source of truth is the
 * NextAuth session; an <AuthSync> component hydrates this store so non-React
 * code (the axios interceptor) can read the token without an async call.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
}));
