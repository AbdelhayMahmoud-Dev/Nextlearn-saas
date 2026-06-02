import { z } from 'zod';

const lessonContentSchema = z.object({
  videoUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  article: z.string().max(100_000).optional(), // sanitized by sanitizeRichText middleware
  attachments: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        url: z.string().url(),
        mimeType: z.string().optional(),
        size: z.number().min(0).optional(),
      }),
    )
    .max(20)
    .optional(),
}).optional();

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    type: z.enum(['video', 'article', 'quiz', 'assignment', 'live']),
    order: z.number().int().min(0).optional(),
    isFree: z.boolean().default(false),
    content: lessonContentSchema,
  }),
});

export const updateLessonSchema = z.object({
  body: createLessonSchema.shape.body.partial(),
});

export const reorderLessonsSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string().min(1)).min(1),
  }),
});

export type CreateLessonBody = z.infer<typeof createLessonSchema>['body'];
