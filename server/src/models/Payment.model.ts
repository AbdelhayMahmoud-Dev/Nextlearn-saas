import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'one-time' | 'subscription';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  /** Hosted Stripe receipt URL (set on charge for one-time payments). */
  stripeReceiptUrl?: string;
  /** Amount in the smallest currency unit (e.g. cents). */
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    stripeSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String, index: true },
    stripeReceiptUrl: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, minlength: 3, maxlength: 3 },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    type: { type: String, enum: ['one-time', 'subscription'], default: 'one-time' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Revenue analytics + forecasting aggregate completed payments over time.
paymentSchema.index({ tenantId: 1, status: 1, createdAt: 1 });
// Per-course/affiliate revenue lookups.
paymentSchema.index({ courseId: 1, status: 1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
