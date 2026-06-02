import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const trackSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1).max(32),
    courseId: objectId.optional(),
  }),
});

export const payoutEmailSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
  }),
});

export const setRateSchema = z.object({
  body: z.object({
    rate: z.coerce.number().min(0).max(100),
  }),
});

export const setStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'suspended']),
  }),
});

export const markPaidSchema = z.object({
  body: z.object({
    reference: z.string().trim().max(200).optional(),
  }),
});

export type TrackInput = z.infer<typeof trackSchema>['body'];
export type PayoutEmailInput = z.infer<typeof payoutEmailSchema>['body'];
