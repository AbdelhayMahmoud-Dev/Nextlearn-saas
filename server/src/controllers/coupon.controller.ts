import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { getAuthUser, getTenantId } from '../utils/requestContext';
import { Course } from '../models/Course.model';
import { CouponService } from '../services/coupon.service';
import type { CreateCouponBody, UpdateCouponBody } from '../validations/coupon.validation';

export const CouponController = {
  /** Public-to-authenticated: validate a code against a course and return savings. */
  validate: asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { code, courseId } = req.body as { code: string; courseId: string };
    const course = await Course.findOne({ _id: courseId, tenantId }).select('price').lean();
    if (!course) throw ApiError.notFound('Course not found');
    const result = await CouponService.validateCoupon(tenantId, code, courseId, course.price);
    ApiResponse.success(res, result, 'Coupon valid');
  }),

  // ── Admin ──────────────────────────────────────────────────────────────────
  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const coupon = await CouponService.createCoupon(user.tenantId, req.body as CreateCouponBody);
    ApiResponse.created(res, coupon, 'Coupon created');
  }),

  list: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await CouponService.listCoupons(user.tenantId, req.query);
    ApiResponse.success(res, items, 'Coupons', 200, meta);
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const coupon = await CouponService.updateCoupon(
      user.tenantId,
      req.params.id,
      req.body as UpdateCouponBody,
    );
    ApiResponse.success(res, coupon, 'Coupon updated');
  }),

  delete: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await CouponService.deleteCoupon(user.tenantId, req.params.id);
    ApiResponse.noContent(res);
  }),
};
