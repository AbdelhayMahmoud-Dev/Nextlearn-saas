import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Guarantees a tenant context was resolved (by `tenantResolver` or
 * `authenticate`). Returns 400 otherwise. Use on every tenant-scoped route so
 * controllers can trust `req.tenantId` instead of re-checking it.
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    throw ApiError.badRequest(
      'Tenant context is required (set x-tenant-id, x-tenant-slug, or use a tenant subdomain)',
    );
  }
  next();
}
