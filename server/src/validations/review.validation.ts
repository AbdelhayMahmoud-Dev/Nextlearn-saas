import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    courseId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid course id'),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
