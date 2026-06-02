import { Schema, model, Document, Types } from 'mongoose';

/** Transactional email types a tenant can customize. */
export type EmailTemplateKey = 'welcome' | 'verification' | 'passwordReset' | 'enrollment';

export const EMAIL_TEMPLATE_KEYS: EmailTemplateKey[] = [
  'welcome',
  'verification',
  'passwordReset',
  'enrollment',
];

/** A per-tenant override for a transactional email. */
export interface IEmailTemplate extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  key: EmailTemplateKey;
  subject: string;
  heading: string;
  /** Body with {{variable}} placeholders. */
  body: string;
  /** When false, the platform default is used instead. */
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    key: {
      type: String,
      enum: EMAIL_TEMPLATE_KEYS,
      required: true,
    },
    subject: { type: String, required: true, maxlength: 200 },
    heading: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 5000 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

emailTemplateSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const EmailTemplate = model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);
