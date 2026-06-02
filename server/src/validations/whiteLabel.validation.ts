import { z } from 'zod';

export const applyPresetSchema = z.object({
  body: z.object({
    presetId: z.string().trim().min(1),
  }),
});

export const customDomainSchema = z.object({
  body: z.object({
    domain: z.string().trim().min(3).max(253),
  }),
});

export const featureFlagsSchema = z.object({
  body: z
    .object({
      liveSessions: z.boolean().optional(),
      certificates: z.boolean().optional(),
      coupons: z.boolean().optional(),
      affiliates: z.boolean().optional(),
      marketplace: z.boolean().optional(),
      aiAssistant: z.boolean().optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one flag is required' }),
});

const templateKey = z.enum(['welcome', 'verification', 'passwordReset', 'enrollment']);

export const upsertEmailTemplateSchema = z.object({
  params: z.object({ key: templateKey }),
  body: z.object({
    subject: z.string().trim().min(1).max(200),
    heading: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(5000),
    enabled: z.boolean(),
  }),
});

export const previewEmailTemplateSchema = z.object({
  body: z.object({
    subject: z.string().max(200),
    heading: z.string().max(200),
    body: z.string().max(5000),
  }),
});

export type FeatureFlagsInput = z.infer<typeof featureFlagsSchema>['body'];
