import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Use lowercase letters, numbers, and hyphens only');

const planEnum = z.enum(['free', 'starter', 'pro', 'enterprise']);

export const tenantSignupSchema = z.object({
  body: z.object({
    orgName: z.string().trim().min(3).max(120),
    slug,
    adminName: z.string().trim().min(1).max(100),
    adminEmail: z.string().trim().toLowerCase().email(),
    plan: z.literal('free').optional(),
  }),
});

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3).max(120),
    slug,
    adminName: z.string().trim().min(1).max(100),
    adminEmail: z.string().trim().toLowerCase().email(),
    plan: planEnum.optional(),
    planExpiresAt: z.string().datetime().optional(),
  }),
});

export const updatePlanSchema = z.object({
  body: z.object({
    plan: planEnum,
    planExpiresAt: z.string().datetime().nullable().optional(),
  }),
});

export const toggleTenantStatusSchema = z.object({
  body: z.object({ isActive: z.boolean() }),
});

export const deleteTenantSchema = z.object({
  body: z.object({ confirmSlug: z.string().trim().min(1) }),
});

export type TenantSignupBody = z.infer<typeof tenantSignupSchema>['body'];
export type CreateTenantBodyInput = z.infer<typeof createTenantSchema>['body'];
