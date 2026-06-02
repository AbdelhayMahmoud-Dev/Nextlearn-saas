import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from './User.model';

/**
 * Append-only record of privileged actions (admin/superadmin mutations) for
 * compliance + incident review. Never updated after creation.
 */
export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole?: UserRole;
  /** Dotted action key, e.g. 'user.role_changed', 'course.deleted', 'payment.refunded'. */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, enum: ['student', 'instructor', 'admin', 'superadmin'] },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
