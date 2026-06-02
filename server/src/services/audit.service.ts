import { FilterQuery, Types } from 'mongoose';
import { AuditLog, IAuditLog } from '../models/AuditLog.model';
import { User } from '../models/User.model';
import { UserRole } from '../models/User.model';
import { buildPaginationMeta, getPagination } from '../utils/pagination';

export interface AuditArgs {
  tenantId: string;
  actorId: string;
  actorRole?: UserRole;
  /** Dotted action key, e.g. 'user.role_changed'. */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

type ActorLite = { _id: Types.ObjectId; name: string; email: string };

export const AuditService = {
  /** Records a privileged action. Best-effort — never breaks the action. */
  async record(args: AuditArgs): Promise<void> {
    try {
      await AuditLog.create({
        tenantId: new Types.ObjectId(args.tenantId),
        actorId: new Types.ObjectId(args.actorId),
        actorRole: args.actorRole,
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId,
        metadata: args.metadata ?? {},
        ip: args.ip,
        userAgent: args.userAgent,
      });
    } catch {
      // Audit logging must never break the underlying action.
    }
  },

  /** Admin: paginated audit log with actor info (filter by action/actor). */
  async list(
    tenantId: string,
    query: { page?: unknown; limit?: unknown; action?: string; actorId?: string },
  ) {
    const { page, limit, skip } = getPagination(query, 100);
    const filter: FilterQuery<IAuditLog> = { tenantId };
    if (query.action) filter.action = query.action;
    if (query.actorId) filter.actorId = new Types.ObjectId(query.actorId);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    const actorIds = [...new Set(logs.map((l) => l.actorId.toString()))];
    const actors = await User.find({ _id: { $in: actorIds } })
      .select('name email')
      .lean<ActorLite[]>();
    const byId = new Map(actors.map((a) => [a._id.toString(), a]));

    const items = logs.map((l) => ({ ...l, actor: byId.get(l.actorId.toString()) ?? null }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },
};
