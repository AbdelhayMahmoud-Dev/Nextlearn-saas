import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { UserRole } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

/** Reads a JWT's `exp` (ms) without verifying — edge-safe (uses atob, not Buffer). */
function decodeJwtExpiryMs(token: string): number {
  try {
    const part = token.split('.')[1] ?? '';
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    const decoded = JSON.parse(json) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** Exchanges the stored Express refresh token for a fresh access/refresh pair. */
async function refreshExpressToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: { accessToken: string; refreshToken?: string } }
      | null;
    if (!res.ok || !json?.success || !json.data) throw new Error('refresh failed');
    return {
      ...token,
      accessToken: json.data.accessToken,
      refreshToken: json.data.refreshToken ?? token.refreshToken,
      accessTokenExpires: decodeJwtExpiryMs(json.data.accessToken),
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantId: { label: 'Tenant', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const tenantId = (credentials?.tenantId as string | undefined) || DEFAULT_TENANT_ID;
        if (!email || !password || !tenantId) return null;

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify({ email, password }),
        });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: {
            user: {
              id: string;
              name: string;
              email: string;
              role: UserRole;
              tenantId: string;
              isVerified: boolean;
              avatar?: string;
            };
            accessToken: string;
            refreshToken: string;
          };
        } | null;
        if (!res.ok || !json?.success || !json.data) return null;

        const { user, accessToken, refreshToken } = json.data;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar ?? null,
          role: user.role,
          tenantId: user.tenantId,
          isVerified: user.isVerified,
          avatar: user.avatar,
          accessToken,
          refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: persist Express tokens + identity into the JWT.
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = decodeJwtExpiryMs(user.accessToken);
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.isVerified = user.isVerified;
        return token;
      }
      // Still valid (30s skew) → reuse; otherwise refresh against Express.
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 30_000) {
        return token;
      }
      return refreshExpressToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role ?? 'student';
        session.user.tenantId = token.tenantId ?? '';
        session.user.isVerified = token.isVerified ?? false;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
