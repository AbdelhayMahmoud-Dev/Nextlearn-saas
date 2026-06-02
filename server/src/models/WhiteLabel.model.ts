import { Schema, model, Document, Types } from 'mongoose';
import { TenantPlan } from './Tenant.model';

export interface IWhiteLabelFeatures {
  liveSessions: boolean;
  certificates: boolean;
  coupons: boolean;
  customDomain: boolean;
}

export interface IWhiteLabel extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  logo?: string;
  primaryColor: string;
  accentColor: string;
  domain?: string;
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
    domain: { type: String, trim: true, lowercase: true },
    features: {
      liveSessions: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      coupons: { type: Boolean, default: true },
      customDomain: { type: Boolean, default: false },
    },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
  },
  { timestamps: true },
);

export const WhiteLabel = model<IWhiteLabel>('WhiteLabel', whiteLabelSchema);
