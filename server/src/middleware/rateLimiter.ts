import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/** Tenant self-signup limiter: 3 new platforms / hour / IP. */
export const tenantSignupLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many signups from this IP. Try again in an hour.' },
});

/** Global limiter: 100 requests / 15 min / IP. */
export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

/** AI assistant limiter: 30 generations / 15 min / IP (hosted calls cost money). */
export const aiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please try again shortly.' },
});

/**
 * Strict limiter for auth endpoints: 5 attempts / 15 min / IP.
 * Successful requests are not counted, so legitimate logins aren't penalized.
 */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes.' },
});
