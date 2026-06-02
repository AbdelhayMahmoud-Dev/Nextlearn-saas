import { z } from 'zod';

/**
 * Coupon write schema.
 * - `percent` coupons: `discountValue` is 0–100.
 * - `fixed` coupons: `discountValue` is in major currency units (e.g. dollars),
 *   consistent with how `Course.price` is stored.
 * - `maxUses`: 0 = unlimited.
 */
export const createCouponSchema = z.object({
  body: z
    .object({
      code: z.string().trim().min(3).max(20).toUpperCase(),
      discountType: z.enum(['percent', 'fixed']),
      discountValue: z.number().positive(),
      maxUses: z.number().int().min(0).default(0),
      expiresAt: z.string().datetime().nullable().optional(),
      applicableCourses: z.array(z.string().trim().min(1)).default([]),
      isActive: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      if (data.discountType === 'percent' && data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountValue'],
          message: 'Percent discount cannot exceed 100',
        });
      }
    }),
});

export const updateCouponSchema = z.object({
  body: z
    .object({
      code: z.string().trim().min(3).max(20).toUpperCase(),
      discountType: z.enum(['percent', 'fixed']),
      discountValue: z.number().positive(),
      maxUses: z.number().int().min(0),
      expiresAt: z.string().datetime().nullable(),
      applicableCourses: z.array(z.string().trim().min(1)),
      isActive: z.boolean(),
    })
    .partial(),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1),
    courseId: z.string().trim().min(1),
  }),
});

export type CreateCouponBody = z.infer<typeof createCouponSchema>['body'];
export type UpdateCouponBody = z.infer<typeof updateCouponSchema>['body'];
