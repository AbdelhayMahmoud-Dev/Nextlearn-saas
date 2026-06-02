import { z } from 'zod';

export const createModuleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(160),
  }),
});

export const updateModuleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const reorderModulesSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string().min(1)).min(1),
  }),
});

export type CreateModuleBody = z.infer<typeof createModuleSchema>['body'];
export type UpdateModuleBody = z.infer<typeof updateModuleSchema>['body'];
