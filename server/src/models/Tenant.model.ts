import { Schema, model, Document, Types } from 'mongoose';

export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type StripeAccountStatus = 'pending' | 'active' | 'restricted' | 'disabled';

export interface ITenantBranding {
  logo?: string;
  primaryColor: string;
  accentColor: string;
  font: string;
}

export interface ITenant extends Document {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  domain?: string;
  branding: ITenantBranding;
  plan: TenantPlan;
  planExpiresAt?: Date;
  stripeAccountId?: string;
  stripeAccountStatus?: StripeAccountStatus;
  stripeOnboardingComplete: boolean;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandingSchema = new Schema<ITenantBranding>(
  {
    logo: { type: String },
    primaryColor: { type: String, default: '#6366f1' },
    accentColor: { type: String, default: '#8b5cf6' },
    font: { type: String, default: 'Inter' },
  },
  { _id: false },
);

const tenantSchema = new Schema<ITenant>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 2,
      maxlength: 63,
      match: [/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Slug must be a valid subdomain label'],
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    domain: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    branding: { type: brandingSchema, default: () => ({}) },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    planExpiresAt: { type: Date },
    stripeAccountId: { type: String },
    stripeAccountStatus: { type: String, enum: ['pending', 'active', 'restricted', 'disabled'] },
    stripeOnboardingComplete: { type: Boolean, default: false },
    settings: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Tenant = model<ITenant>('Tenant', tenantSchema);
