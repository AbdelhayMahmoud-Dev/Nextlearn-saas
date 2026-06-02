import { Schema, model, Document, Types } from 'mongoose';

export type DiscountType = 'percent' | 'fixed';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  code: string;
  discountType: DiscountType;
  /** Percent (0–100) when `percent`, or smallest currency unit when `fixed`. */
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  /** Empty array = applies to all courses. */
  applicableCourses: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date },
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Coupon codes are unique within a tenant.
couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const Coupon = model<ICoupon>('Coupon', couponSchema);
