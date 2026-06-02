import { Schema, model, Document, Types } from 'mongoose';

/**
 * A device session, one per issued refresh token. The `refreshTokenHash` mirrors
 * the hash stored in `User.refreshTokens`, so revoking a session and removing the
 * matching hash keep auth and the session list in lock-step.
 */
export interface ISession extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  /** Refresh token id (rotates on every refresh). */
  jti: string;
  /** SHA-256 of the current refresh token for this device. */
  refreshTokenHash: string;
  ip?: string;
  userAgent?: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true },
    refreshTokenHash: { type: String, required: true, unique: true },
    ip: { type: String },
    userAgent: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, lastSeenAt: -1 });

export const Session = model<ISession>('Session', sessionSchema);
