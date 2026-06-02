import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(1000).optional(),
    avatar: z.string().url().optional(),
    socialLinks: z
      .object({
        website: z.string().url().or(z.literal('')).optional(),
        twitter: z.string().trim().max(120).optional(),
        linkedin: z.string().trim().max(120).optional(),
        github: z.string().trim().max(120).optional(),
      })
      .optional(),
    preferences: z
      .object({
        emailCourseUpdates: z.boolean().optional(),
        emailPromotions: z.boolean().optional(),
        emailWeeklyDigest: z.boolean().optional(),
        language: z.string().trim().max(10).optional(),
      })
      .optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/[0-9]/, 'Add a number'),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
