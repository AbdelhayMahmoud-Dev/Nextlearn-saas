import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** A duration string accepted by both `jsonwebtoken` and our cookie maxAge parser. */
const durationString = z
  .string()
  .regex(/^\d+(ms|s|m|h|d|w)$/, 'Must be a duration like "15m", "7d", or "30s"');

/**
 * Schema for all environment variables. Validated once at boot so the process
 * fails fast (and loudly) on misconfiguration instead of crashing mid-request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: durationString.default('15m'),
  JWT_REFRESH_EXPIRES_IN: durationString.default('7d'),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('NextLearn <noreply@nextlearn.com>'),

  REDIS_URL: z.string().optional(),

  // Stripe — intentionally OPTIONAL so the app (and seed scripts) still boot in
  // environments without billing configured. Payment endpoints guard at the
  // use-site and return a clear error when these are missing.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_ANNUAL_PRICE_ID: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().url().default('http://localhost:3000/payment/success'),
  STRIPE_CANCEL_URL: z.string().url().default('http://localhost:3000/payment/cancel'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // AI Learning Assistant. Provider is pluggable; when the selected hosted
  // provider has no API key, the service transparently falls back to the
  // dependency-free local provider so the feature always works.
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'local']).default('local'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-haiku-latest'),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(1024),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.4),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // The logger depends on env, so it isn't available here — write to stderr directly.
  process.stderr.write(
    `❌ Invalid environment configuration:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}\n`,
  );
  process.exit(1);
}

const data = parsed.data;

/**
 * Strongly-typed, validated, frozen application configuration.
 * Import this everywhere instead of touching `process.env` directly.
 */
export const env = Object.freeze({
  ...data,
  isProd: data.NODE_ENV === 'production',
  isDev: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  allowedOrigins: data.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});

export type Env = typeof env;
