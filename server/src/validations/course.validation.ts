import { z } from 'zod';

/** All valid course categories. */
export const COURSE_CATEGORIES = [
  'programming', 'data-science', 'ai-ml', 'cybersecurity', 'cloud',
  'web-development', 'mobile', 'devops', 'database', 'ui-ux',
  'mathematics', 'physics', 'chemistry', 'biology', 'engineering',
  'business', 'marketing', 'finance', 'language', 'other',
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

// ── Public list query ──────────────────────────────────────────────────────

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  price: z.enum(['free', 'paid']).optional(),
  sort: z.enum(['popular', 'newest', 'rating', 'price-asc', 'price-desc']).default('popular'),
});

export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;

// ── Instructor write schemas ──────────────────────────────────────────────

const courseBodySchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000),
  shortDescription: z.string().trim().max(200).optional(),
  category: z.enum(COURSE_CATEGORIES),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().default('en'),
  price: z.number().min(0).default(0),
  salePrice: z.number().min(0).optional(),
  currency: z.enum(['USD', 'EUR', 'SAR', 'EGP', 'GBP']).default('USD'),
  enrollmentType: z.enum(['free', 'one-time', 'subscription', 'both']).default('free'),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  requirements: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  outcomes: z.array(z.string().trim().min(1).max(200)).min(1, 'At least one outcome required').max(20),
  thumbnail: z.string().url().optional(),
  previewVideo: z.string().url().optional(),
});

export const createCourseSchema = z.object({ body: courseBodySchema });
export const updateCourseSchema = z.object({ body: courseBodySchema.partial() });

export type CreateCourseBody = z.infer<typeof courseBodySchema>;
