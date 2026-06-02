import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    courseId: z.string().trim().min(1),
    couponCode: z.string().trim().min(1).optional(),
    referralCode: z.string().trim().min(1).max(32).optional(),
  }),
});

export const subscribeSchema = z.object({
  body: z.object({
    plan: z.enum(['monthly', 'annual']),
  }),
});

export type CheckoutBody = z.infer<typeof checkoutSchema>['body'];
export type SubscribeBody = z.infer<typeof subscribeSchema>['body'];
