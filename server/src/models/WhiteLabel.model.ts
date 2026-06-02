import { Schema, model, Document, Types } from 'mongoose';
import { TenantPlan } from './Tenant.model';

export interface IWhiteLabelFeatures {
  liveSessions: boolean;
  certificates: boolean;
  coupons: boolean;
  customDomain: boolean;
  affiliates: boolean;
  marketplace: boolean;
  aiAssistant: boolean;
}

export type DomainStatus = 'none' | 'pending' | 'verified' | 'failed';

export interface IWhiteLabel extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  logo?: string;
  primaryColor: string;
  accentColor: string;
  /** Font preset key applied across the tenant (e.g. 'inter', 'manrope'). */
  font: string;
  /** Applied theme preset id (so the UI can show the active preset). */
  themePreset?: string;
  domain?: string;
  /** Custom domain the tenant is connecting (pre/post verification). */
  customDomain?: string;
  domainStatus: DomainStatus;
  /** TXT value the tenant must publish at _nextlearn.<domain> to verify. */
  domainVerificationToken?: string;
  domainVerifiedAt?: Date;
  features: IWhiteLabelFeatures;
  plan: TenantPlan;
  createdAt: Date;
  updatedAt: Date;
}

const whiteLabelSchema = new Schema<IWhiteLabel>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String },
    primaryColor: { type: String, default: '#6366f1' },
    accentColor: { type: String, default: '#8b5cf6' },
    font: { type: String, default: 'inter' },
    themePreset: { type: String },
    domain: { type: String, trim: true, lowercase: true },
    customDomain: { type: String, trim: true, lowercase: true },
    domainStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'failed'],
      default: 'none',
    },
    domainVerificationToken: { type: String },
    domainVerifiedAt: { type: Date },
    features: {
      liveSessions: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      coupons: { type: Boolean, default: true },
      customDomain: { type: Boolean, default: false },
      affiliates: { type: Boolean, default: true },
      marketplace: { type: Boolean, default: true },
      aiAssistant: { type: Boolean, default: true },
    },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
  },
  { timestamps: true },
);

export const WhiteLabel = model<IWhiteLabel>('WhiteLabel', whiteLabelSchema);
