import { Schema, model, Document, Types } from 'mongoose';

/** A tracked referral click, used for attribution + click analytics. */
export interface IAffiliateReferral extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  affiliateId: Types.ObjectId;
  code: string;
  /** Optional landing course the link pointed at. */
  courseId?: Types.ObjectId;
  ip?: string;
  userAgent?: string;
  /** Set true once this click (or its visitor) results in a conversion. */
  converted: boolean;
  createdAt: Date;
}

const referralSchema = new Schema<IAffiliateReferral>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    code: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    ip: { type: String },
    userAgent: { type: String },
    converted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

referralSchema.index({ affiliateId: 1, createdAt: -1 });

export const AffiliateReferral = model<IAffiliateReferral>('AffiliateReferral', referralSchema);
