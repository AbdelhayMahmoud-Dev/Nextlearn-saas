import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { env } from '../config/env';

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
 * Returns true if the browser `Origin` is permitted to make credentialed
 * cross-origin requests against this API.
 *
 * Three sources, in order:
 *  1. The explicit allow-list (`ALLOWED_ORIGINS` + `CLIENT_URL`, see config/env).
 *  2. Any Vercel deployment URL (`https://*.vercel.app`) — the production
 *     frontend AND the per-commit preview deployments, whose hostnames change
 *     on every push and therefore can't be pinned in an env var.
 *  3. Localhost on any port (dev only) so a local frontend can hit a remote API.
 *
 * The browser's `Origin` header never has a trailing slash, and `env.allowedOrigins`
 * is already normalized the same way, so comparison is exact.
 */
function isAllowedOrigin(origin: string): boolean {
  if (env.allowedOrigins.includes(origin)) return true;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  // Vercel-hosted frontends: https://<project>.vercel.app and previews like
  // https://<project>-git-<branch>-<scope>.vercel.app.
  if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) return true;

  // Local development frontends.
  if (env.isDev && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return true;

  return false;
}

/**
 * Headers + CORS. Safe to apply BEFORE body parsing (these don't touch the body).
 *
 * The CORS layer is mounted here, before any route — so the `cors` package also
 * answers the OPTIONS preflight (204 + the Access-Control-* headers) for every
 * endpoint, including `/tenant/config`, `/auth/*` and all public routes.
 */
export function applyEarlySecurity(app: Express): void {
  app.use(helmet());

  const corsMiddleware = cors({
    origin(origin, callback) {
      // No Origin header → non-browser client (curl, server-to-server, health
      // probes). Nothing to protect with CORS; allow it.
      if (!origin) {
        callback(null, true);
        return;
      }
      // For a disallowed origin, resolve WITHOUT an error and WITHOUT the
      // `Access-Control-Allow-Origin` header. Throwing here would route the
      // preflight into the error handler (a 403/500 with no CORS headers),
      // which the browser surfaces as an opaque "Network Error". Returning
      // `false` lets the request complete normally; the browser still blocks
      // the disallowed origin because the ACAO header is absent.
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    // `cors` reflects the requested headers by default, which already covers
    // Authorization and our custom `x-tenant-id` header.
    optionsSuccessStatus: 204,
  });

  app.use(corsMiddleware);
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
