import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * Recursively strips angle-bracket tags and `javascript:` URIs from string
 * values. A lightweight, dependency-free stand-in for the unmaintained
 * `xss-clean` package.
 *
 * NOTE: routes that legitimately accept HTML (e.g. Tiptap rich-text lesson
 * content) should be parsed/sanitized with a dedicated allow-list sanitizer
 * instead of relying on this blanket pass.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>?/g, '').replace(/javascript:/gi, '');
  }
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeValue(val);
    }
    return out;
  }
  return value;
}

function xssSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}

/**
 * Headers + CORS. Safe to apply BEFORE body parsing (these don't touch the body).
 */
export function applyEarlySecurity(app: Express): void {
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, server-to-server) with no Origin.
        if (!origin || env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new ApiError(403, `Origin "${origin}" is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
}

/**
 * Input sanitizers (NoSQL-injection, HTTP parameter pollution, XSS). These read
 * `req.body`/`req.query`, so they MUST be registered AFTER the body parsers —
 * otherwise the body is still undefined and sanitization silently does nothing.
 */
export function applyInputSanitizers(app: Express): void {
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(xssSanitizer);
}
