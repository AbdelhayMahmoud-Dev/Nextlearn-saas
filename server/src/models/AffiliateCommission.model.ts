import { Schema, model, Document, Types } from 'mongoose';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed';

/** A commission earned by an affiliate on an attributed conversion. */
export interface IAffiliateCommission extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  affiliateId: Types.ObjectId;
  /** The referred buyer. */
  referredUserId: Types.ObjectId;
  courseId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  /** Order total the commission was computed from, in cents. */
  orderAmountCents: number;
  /** Rate applied (percentage), captured at conversion time. */
  rate: number;
  /** Commission owed, in cents. */
  amountCents: number;
  status: CommissionStatus;
  payoutId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<IAffiliateCommission>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    affiliateId: { type: Schema.Types.ObjectId, ref: 'Affiliate', required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    orderAmountCents: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0, max: 100 },
    amountCents: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'reversed'],
      default: 'pending',
      index: true,
    },
    payoutId: { type: Schema.Types.ObjectId, ref: 'AffiliatePayout' },
  },
  { timestamps: true },
);

commissionSchema.index({ affiliateId: 1, status: 1, createdAt: -1 });
// One commission per payment (idempotent attribution on webhook retries).
commissionSchema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $exists: true } } },
);

export const AffiliateCommission = model<IAffiliateCommission>(
  'AffiliateCommission',
  commissionSchema,
);
