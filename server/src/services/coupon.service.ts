import { Types } from 'mongoose';
import { Coupon, ICoupon } from '../models/Coupon.model';
import { Payment } from '../models/Payment.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import type { CreateCouponBody, UpdateCouponBody } from '../validations/coupon.validation';

/** Discounted-price breakdown, all monetary values in major units (dollars). */
export interface CouponValidationResult {
  valid: true;
  couponId: string;
  code: string;
  discount: {
    type: 'percent' | 'fixed';
    value: number;
    originalPrice: number;
    savings: number;
    finalPrice: number;
  };
}

/** Rounds a float dollar amount to integer cents. */
function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export const CouponService = {
  /**
   * Validates a coupon for a course and computes the discounted price.
   * Does NOT increment usedCount — that happens only after a successful payment.
   *
   * @param originalPrice - The course price in dollars.
   * @throws ApiError(400) with a specific reason when the coupon is not usable.
   */
  async validateCoupon(
    tenantId: string,
    code: string,
    courseId: string,
    originalPrice: number,
  ): Promise<CouponValidationResult> {
    const coupon = await Coupon.findOne({ tenantId, code: code.trim().toUpperCase() }).lean();
    if (!coupon) throw ApiError.badRequest('Invalid coupon code');
    if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active');
    if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
      throw ApiError.badRequest('This coupon has expired');
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw ApiError.badRequest('This coupon has reached its usage limit');
    }
    if (
      coupon.applicableCourses.length > 0 &&
      !coupon.applicableCourses.some((id) => id.toString() === courseId)
    ) {
      throw ApiError.badRequest('This coupon is not applicable to this course');
    }

    // All math in integer cents to avoid floating-point drift.
    const originalCents = toCents(originalPrice);
    const savingsCents =
      coupon.discountType === 'percent'
        ? Math.round((originalCents * coupon.discountValue) / 100)
        : Math.min(toCents(coupon.discountValue), originalCents);
    const finalCents = Math.max(0, originalCents - savingsCents);

    return {
      valid: true,
      couponId: coupon._id.toString(),
      code: coupon.code,
      discount: {
        type: coupon.discountType,
        value: coupon.discountValue,
        originalPrice: originalCents / 100,
        savings: savingsCents / 100,
        finalPrice: finalCents / 100,
      },
    };
  },

  /** Atomically increments usedCount after a successful payment (race-safe). */
  async applyCoupon(couponId: string): Promise<void> {
    await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } });
  },

  /** Creates a coupon (admin only). Codes are unique per tenant. */
  async createCoupon(tenantId: string, data: CreateCouponBody): Promise<ICoupon> {
    const exists = await Coupon.findOne({ tenantId, code: data.code }).lean();
    if (exists) throw ApiError.conflict('A coupon with this code already exists');

    const coupon = await Coupon.create({
      tenantId: new Types.ObjectId(tenantId),
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses,
      usedCount: 0,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      applicableCourses: data.applicableCourses.map((id) => new Types.ObjectId(id)),
      isActive: data.isActive,
    });
    return coupon.toObject();
  },

  /** Lists coupons for a tenant (admin only), paginated. */
  async listCoupons(tenantId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = getPagination(query, 100);
    const [items, total] = await Promise.all([
      Coupon.find({ tenantId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments({ tenantId }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Updates a coupon (admin only). */
  async updateCoupon(tenantId: string, couponId: string, data: UpdateCouponBody) {
    const update: Record<string, unknown> = { ...data };
    if (data.expiresAt !== undefined) {
      update.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.applicableCourses !== undefined) {
      update.applicableCourses = data.applicableCourses.map((id) => new Types.ObjectId(id));
    }
    const coupon = await Coupon.findOneAndUpdate(
      { _id: couponId, tenantId },
      { $set: update },
      { new: true },
    ).lean();
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return coupon;
  },

  /** Soft-deletes a used coupon (isActive: false); hard-deletes an unused one. */
  async deleteCoupon(tenantId: string, couponId: string): Promise<void> {
    const coupon = await Coupon.findOne({ _id: couponId, tenantId }).select('usedCount').lean();
    if (!coupon) throw ApiError.notFound('Coupon not found');
    if (coupon.usedCount > 0) {
      await Coupon.updateOne({ _id: couponId, tenantId }, { $set: { isActive: false } });
    } else {
      await Coupon.deleteOne({ _id: couponId, tenantId });
    }
  },

  /**
   * Per-coupon usage analytics. `revenueImpact` is the completed-payment revenue
   * attributed to each coupon (payments tagged with `metadata.couponId`);
   * `totalSavings` is an estimate derived from the coupon's discount.
   */
  async couponAnalytics(tenantId: string) {
    const coupons = await Coupon.find({ tenantId }).sort({ createdAt: -1 }).lean();

    // Completed revenue grouped by the coupon id stored on each payment.
    const revenueRows = await Payment.aggregate<{ _id: string; revenue: number; uses: number }>([
      { $match: { tenantId: new Types.ObjectId(tenantId), status: 'completed', 'metadata.couponId': { $exists: true } } },
      { $group: { _id: '$metadata.couponId', revenue: { $sum: '$amount' }, uses: { $sum: 1 } } },
    ]);
    const revMap = new Map(revenueRows.map((r) => [r._id, r]));

    return coupons.map((c) => {
      const agg = revMap.get(c._id.toString());
      const revenueImpact = agg ? agg.revenue / 100 : 0;
      const totalSavings =
        c.discountType === 'percent'
          ? Math.round(revenueImpact * (c.discountValue / Math.max(1, 100 - c.discountValue)) * 100) / 100
          : Math.round((agg?.uses ?? 0) * c.discountValue * 100) / 100;
      return {
        coupon: c,
        totalUses: c.usedCount,
        totalSavings,
        revenueImpact,
        topCourses: [] as string[],
      };
    });
  },
};
