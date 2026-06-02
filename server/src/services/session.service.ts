import { Types } from 'mongoose';
import { Session } from '../models/Session.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { SecurityService } from './security.service';

export interface SessionContext {
  ip?: string;
  userAgent?: string;
}

interface RecordSessionArgs {
  tenantId: string;
  userId: string;
  jti: string;
  refreshTokenHash: string;
  /** When rotating (refresh), the previous hash to replace in-place. */
  replaceHash?: string;
  context?: SessionContext;
}

export const SessionService = {
  /**
   * Records a device session on token issue, or rotates the existing one in
   * place on refresh. Best-effort: never throws, so auth can't break on it.
   */
  async record(args: RecordSessionArgs): Promise<void> {
    try {
      if (args.replaceHash) {
        const updated = await Session.findOneAndUpdate(
          { refreshTokenHash: args.replaceHash },
          {
            $set: {
              refreshTokenHash: args.refreshTokenHash,
              jti: args.jti,
              lastSeenAt: new Date(),
              ...(args.context?.ip ? { ip: args.context.ip } : {}),
              ...(args.context?.userAgent ? { userAgent: args.context.userAgent } : {}),
            },
          },
          { new: true },
        );
        if (updated) return;
      }
      await Session.create({
        tenantId: new Types.ObjectId(args.tenantId),
        userId: new Types.ObjectId(args.userId),
        jti: args.jti,
        refreshTokenHash: args.refreshTokenHash,
        ip: args.context?.ip,
        userAgent: args.context?.userAgent,
        lastSeenAt: new Date(),
      });
    } catch {
      // Session tracking must never break the auth flow.
    }
  },

  /** Lists a user's sessions (never exposes the token hash). */
  async listForUser(tenantId: string, userId: string, currentHash?: string) {
    const sessions = await Session.find({ tenantId, userId }).sort({ lastSeenAt: -1 }).lean();
    return sessions.map((s) => ({
      id: s._id.toString(),
      ip: s.ip ?? null,
      userAgent: s.userAgent ?? null,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : false,
    }));
  },

  /** Revokes one session: drops its refresh token + the session doc. */
  async revoke(
    tenantId: string,
    userId: string,
    sessionId: string,
    context?: SessionContext,
  ): Promise<void> {
    const session = await Session.findOne({ _id: sessionId, tenantId, userId });
    if (!session) throw ApiError.notFound('Session not found');
    await User.updateOne(
      { _id: userId, tenantId },
      { $pull: { refreshTokens: session.refreshTokenHash } },
    );
    await Session.deleteOne({ _id: session._id });
    await SecurityService.record({
      tenantId,
      userId,
      type: 'session_revoked',
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { sessionId },
    });
  },

  /** Revokes all of a user's sessions, optionally keeping the current one. */
  async revokeAll(tenantId: string, userId: string, exceptHash?: string): Promise<void> {
    await Session.deleteMany({
      tenantId,
      userId,
      ...(exceptHash ? { refreshTokenHash: { $ne: exceptHash } } : {}),
    });
    await User.updateOne(
      { _id: userId, tenantId },
      { $set: { refreshTokens: exceptHash ? [exceptHash] : [] } },
    );
  },

  /** Removes the session for a specific refresh token (used on logout). */
  async revokeByHash(hash: string): Promise<void> {
    try {
      await Session.deleteOne({ refreshTokenHash: hash });
    } catch {
      // Non-fatal.
    }
  },

  /** Deletes every session for a user (after password change/reset). */
  async clearForUser(userId: string): Promise<void> {
    try {
      await Session.deleteMany({ userId: new Types.ObjectId(userId) });
    } catch {
      // Non-fatal.
    }
  },
};
