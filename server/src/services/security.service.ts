import { FilterQuery, Types } from 'mongoose';
import { SecurityEvent, ISecurityEvent, SecurityEventType } from '../models/SecurityEvent.model';
import { buildPaginationMeta, getPagination } from '../utils/pagination';

const FAILED_WINDOW_MS = 15 * 60 * 1000;
const FAILED_THRESHOLD = 5;

const HISTORY_TYPES: SecurityEventType[] = [
  'login_success',
  'login_failed',
  'logout',
  'password_changed',
  'password_reset',
  'session_revoked',
  'suspicious_activity',
];

export interface RecordSecurityArgs {
  tenantId: string;
  userId?: string;
  email?: string;
  type: SecurityEventType;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const SecurityService = {
  /** Records a security event. Never throws — security logging is best-effort. */
  async record(args: RecordSecurityArgs): Promise<void> {
    try {
      await SecurityEvent.create({
        tenantId: new Types.ObjectId(args.tenantId),
        userId: args.userId ? new Types.ObjectId(args.userId) : undefined,
        email: args.email,
        type: args.type,
        ip: args.ip,
        userAgent: args.userAgent,
        metadata: args.metadata ?? {},
      });
      if (args.type === 'login_failed' && args.email) {
        await SecurityService.detectSuspicious(args);
      }
    } catch {
      // Logging must never break the auth flow.
    }
  },

  /** Flags repeated failed logins for the same email within the window. */
  async detectSuspicious(args: RecordSecurityArgs): Promise<void> {
    const since = new Date(Date.now() - FAILED_WINDOW_MS);
    const count = await SecurityEvent.countDocuments({
      tenantId: new Types.ObjectId(args.tenantId),
      email: args.email,
      type: 'login_failed',
      createdAt: { $gte: since },
    });
    if (count >= FAILED_THRESHOLD) {
      await SecurityEvent.create({
        tenantId: new Types.ObjectId(args.tenantId),
        userId: args.userId ? new Types.ObjectId(args.userId) : undefined,
        email: args.email,
        type: 'suspicious_activity',
        ip: args.ip,
        userAgent: args.userAgent,
        metadata: { reason: 'repeated_failed_logins', count, windowMinutes: 15 },
      });
    }
  },

  /** A user's own login/security history (paginated, newest first). */
  async loginHistory(tenantId: string, userId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = getPagination(query, 50);
    const filter: FilterQuery<ISecurityEvent> = { tenantId, userId, type: { $in: HISTORY_TYPES } };
    const [items, total] = await Promise.all([
      SecurityEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SecurityEvent.countDocuments(filter),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Admin: all security events for the tenant (filter by type/userId). */
  async listEvents(
    tenantId: string,
    query: { page?: unknown; limit?: unknown; type?: string; userId?: string },
  ) {
    const { page, limit, skip } = getPagination(query, 100);
    const filter: FilterQuery<ISecurityEvent> = { tenantId };
    if (query.type) filter.type = query.type as SecurityEventType;
    if (query.userId) filter.userId = new Types.ObjectId(query.userId);
    const [items, total] = await Promise.all([
      SecurityEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SecurityEvent.countDocuments(filter),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },
};
