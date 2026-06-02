import type { UserRole } from '@/types';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
      isVerified: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  /** Returned by `authorize` — carries the Express tokens into the JWT callback. */
  interface User {
    role: UserRole;
    tenantId: string;
    isVerified: boolean;
    accessToken: string;
    refreshToken: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    role?: UserRole;
    tenantId?: string;
    isVerified?: boolean;
    error?: string;
  }
}
