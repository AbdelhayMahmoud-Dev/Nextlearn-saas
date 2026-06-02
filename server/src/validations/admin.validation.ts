import { z } from 'zod';

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color');

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(['student', 'instructor', 'admin']),
  }),
});

export const toggleStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const rejectCourseSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(3).max(500),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }),
});

export const updateBrandingSchema = z.object({
  body: z.object({
    logo: z.string().url().optional(),
    primaryColor: hexColor.optional(),
    accentColor: hexColor.optional(),
    platformName: z.string().trim().min(1).max(80).optional(),
    supportEmail: z.string().email().optional(),
    defaultLanguage: z.string().trim().min(2).max(5).optional(),
  }),
});

export const updateGeneralSchema = z.object({
  body: z.object({
    platformName: z.string().trim().min(1).max(80).optional(),
    supportEmail: z.string().email().optional(),
    defaultLanguage: z.string().trim().min(2).max(5).optional(),
    timezone: z.string().trim().min(1).max(64).optional(),
    maintenanceMode: z.boolean().optional(),
    allowRegistrations: z.boolean().optional(),
    requireEmailVerification: z.boolean().optional(),
    sessionTimeout: z.enum(['1h', '8h', '24h', '7d']).optional(),
    passwordMinLength: z.number().int().min(8).max(32).optional(),
    maxCoursesPerInstructor: z.number().int().min(1).max(10000).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
  }),
});

export type GeneralUpdateBody = z.infer<typeof updateGeneralSchema>['body'];
export type BrandingUpdateBody = z.infer<typeof updateBrandingSchema>['body'];
