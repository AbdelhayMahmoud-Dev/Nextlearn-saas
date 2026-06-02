import { Schema, model, Document, Types } from 'mongoose';

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | 'session_revoked'
  | 'token_reuse'
  | 'suspicious_activity';

/**
 * Append-only security/audit trail for authentication-related activity.
 * `userId` is optional because failed logins for an unknown email have no user.
 */
export interface ISecurityEvent extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId;
  /** Email attempted (kept for failed-login correlation when userId is unknown). */
  email?: string;
  type: SecurityEventType;
  ip?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const securityEventSchema = new Schema<ISecurityEvent>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, lowercase: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
        'login_success',
        'login_failed',
        'logout',
        'password_changed',
        'password_reset',
        'session_revoked',
        'token_reuse',
        'suspicious_activity',
      ],
    },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

securityEventSchema.index({ userId: 1, createdAt: -1 });
securityEventSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
// Drives the failed-login rate check for suspicious-activity detection.
securityEventSchema.index({ email: 1, type: 1, createdAt: -1 });

export const SecurityEvent = model<ISecurityEvent>('SecurityEvent', securityEventSchema);
