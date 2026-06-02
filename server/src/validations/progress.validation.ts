import { z } from 'zod';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

export const markProgressSchema = z.object({
  body: z.object({
    lessonId: objectId,
    courseId: objectId,
    watchedSeconds: z.coerce.number().min(0).optional(),
    isCompleted: z.boolean().optional(),
  }),
});

export type MarkProgressInput = z.infer<typeof markProgressSchema>['body'];
