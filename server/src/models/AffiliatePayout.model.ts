import { Schema, model, Document, Types } from 'mongoose';

export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'failed';

/** A payout of accumulated commissions to an affiliate. */
export interface IAffiliatePayout extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  affiliateId: Types.ObjectId;
  amountCents: number;
  method: string;
  status: PayoutStatus;
  /** External reference (e.g. PayPal batch id) once paid. */
  reference?: string;
  note?: string;
  commissionIds: Types.ObjectId[];
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IAffiliatePayout>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    amountCents: { type: Number, required: true, min: 0 },
    method: { type: String, default: 'manual' },
    status: {
      type: String,
      enum: ['requested', 'processing', 'paid', 'failed'],
      default: 'requested',
    },
    reference: { type: String },
    note: { type: String },
    commissionIds: [{ type: Schema.Types.ObjectId, ref: 'AffiliateCommission' }],
    processedAt: { type: Date },
  },
  { timestamps: true },
);

payoutSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
payoutSchema.index({ affiliateId: 1, createdAt: -1 });

export const AffiliatePayout = model<IAffiliatePayout>('AffiliatePayout', payoutSchema);
