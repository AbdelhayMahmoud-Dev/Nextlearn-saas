import { Schema, model, Document, Types } from 'mongoose';

export interface ITenantSettings extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  platformName: string;
  supportEmail: string;
  defaultLanguage: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  /** Session timeout label, e.g. "8h" / "24h" / "7d". */
  sessionTimeout: string;
  passwordMinLength: number;
  maxCoursesPerInstructor: number;
  /** Platform fee percentage (0–100). */
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSettingsSchema = new Schema<ITenantSettings>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
    platformName: { type: String, default: 'NextLearn', trim: true },
    supportEmail: { type: String, default: 'support@nextlearn.com', trim: true, lowercase: true },
    defaultLanguage: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistrations: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    sessionTimeout: { type: String, default: '7d' },
    passwordMinLength: { type: Number, default: 8, min: 8, max: 32 },
    maxCoursesPerInstructor: { type: Number, default: 100, min: 1 },
    commissionRate: { type: Number, default: 20, min: 0, max: 100 },
  },
  { timestamps: true },
);

export const TenantSettings = model<ITenantSettings>('TenantSettings', tenantSettingsSchema);
