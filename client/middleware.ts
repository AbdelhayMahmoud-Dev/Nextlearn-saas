import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types';

/** Route prefixes that require an authenticated session (any role). */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/my-courses',
  '/certificates',
  '/profile',
  '/subscription',
  '/billing',
  '/notifications',
  '/learn',
];

const ROLE_AREAS: { prefix: string; allowed: UserRole[] }[] = [
  { prefix: '/instructor', allowed: ['instructor', 'admin', 'superadmin'] },
  { prefix: '/admin', allowed: ['admin', 'superadmin'] },
  { prefix: '/superadmin', allowed: ['superadmin'] },
];

const hasPrefix = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`);

/**
 * Next.js route protection. Unauthenticated users hitting protected routes are
 * redirected to /login (with callbackUrl); authenticated users lacking the
 * required role are bounced to /dashboard.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const isLoggedIn = Boolean(session?.user);
  const role = session?.user?.role;

  const roleArea = ROLE_AREAS.find((area) => hasPrefix(path, area.prefix));
  const needsAuth = roleArea !== undefined || PROTECTED_PREFIXES.some((p) => hasPrefix(path, p));

  if (needsAuth && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  if (roleArea && role && !roleArea.allowed.includes(role)) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
