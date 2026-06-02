import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

export const enrollSchema = z.object({
  body: z.object({
    courseId: objectId,
  }),
});

export type EnrollInput = z.infer<typeof enrollSchema>['body'];
