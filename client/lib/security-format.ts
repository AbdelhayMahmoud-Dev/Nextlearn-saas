import type { SecurityEventType } from '@/hooks/useSecurity';

/** Human-readable label for a security event type. */
export const SECURITY_EVENT_LABELS: Record<SecurityEventType, string> = {
  login_success: 'Signed in',
  login_failed: 'Failed sign-in',
  logout: 'Signed out',
  password_changed: 'Password changed',
  password_reset: 'Password reset',
  session_revoked: 'Session revoked',
  token_reuse: 'Token reuse detected',
  suspicious_activity: 'Suspicious activity',
};

/** Whether an event type represents a security concern (rendered with emphasis). */
export function isSecurityConcern(type: SecurityEventType): boolean {
  return type === 'login_failed' || type === 'token_reuse' || type === 'suspicious_activity';
}

/**
 * Derives a short, friendly device label from a user-agent string.
 * Intentionally lightweight — no UA-parsing dependency.
 */
export function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Unknown device';
  const ua = userAgent;

  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Browser';

  const os = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone|iPad|iOS/.test(ua)
      ? 'iOS'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS';

  return `${browser} on ${os}`;
}

/** Title-cases a dotted audit action key, e.g. 'user.role_changed' → 'User · Role changed'. */
export function formatAuditAction(action: string): string {
  const [scope, ...rest] = action.split('.');
  const verb = rest.join('.').replace(/_/g, ' ');
  const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
  return rest.length ? `${cap(scope)} · ${cap(verb)}` : cap(action.replace(/_/g, ' '));
}
