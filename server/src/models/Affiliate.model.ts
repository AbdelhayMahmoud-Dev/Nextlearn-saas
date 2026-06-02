import { Schema, model, Document, Types } from 'mongoose';

export type AffiliateStatus = 'active' | 'suspended';

/** An affiliate account: one per user per tenant, with a unique referral code. */
export interface IAffiliate extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  /** Unique, shareable referral code (appears as ?ref=CODE). */
  code: string;
  status: AffiliateStatus;
  /** Commission as a percentage of each attributed order. */
  commissionRate: number;
  /** Destination for payouts (e.g. PayPal email). */
  payoutEmail?: string;
  /** Lifetime unpaid + paid commission, in cents. */
  pendingCents: number;
  paidCents: number;
  totalClicks: number;
  totalConversions: number;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateSchema = new Schema<IAffiliate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    commissionRate: { type: Number, default: 20, min: 0, max: 100 },
    payoutEmail: { type: String, trim: true },
    pendingCents: { type: Number, default: 0, min: 0 },
    paidCents: { type: Number, default: 0, min: 0 },
    totalClicks: { type: Number, default: 0, min: 0 },
    totalConversions: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// One affiliate account per user per tenant.
affiliateSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const Affiliate = model<IAffiliate>('Affiliate', affiliateSchema);
