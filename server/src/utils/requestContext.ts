import { Request } from 'express';
import { ApiError } from './ApiError';
import type { AuthUser } from '../types/express';

/**
 * Returns the resolved tenant id, throwing if absent. Routes that need a tenant
 * should run `tenantResolver` + `requireTenant` (or `authenticate`, which sets
 * the tenant from the token) first — this is the typed accessor for handlers.
 */
export function getTenantId(req: Request): string {
  if (!req.tenantId) throw ApiError.badRequest('Tenant context is required');
  return req.tenantId;
}

/** Returns the authenticated principal, throwing 401 if the route wasn't guarded. */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

/** Extracts client IP + user-agent for session/audit/security logging. */
export function getRequestContext(req: Request): { ip?: string; userAgent?: string } {
  return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
}
