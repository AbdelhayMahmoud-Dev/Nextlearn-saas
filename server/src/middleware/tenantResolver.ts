import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { TenantService } from '../services/tenant.service';
import { TenantSettings } from '../models/TenantSettings.model';
import type { ITenant } from '../models/Tenant.model';

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'app', 'admin', 'localhost']);

/**
 * Resolves the active tenant and attaches `req.tenantId` + `req.tenant`, in
 * priority order:
 *   1. Authenticated token's tenant (authoritative — never overridden by hints)
 *   2. `x-tenant-id` header (explicit ObjectId)
 *   3. `x-tenant-slug` header
 *   4. Subdomain of the Host header (`{slug}.nextlearn.com`)
 *   5. Custom domain (`learn.acme.com`)
 *
 * Requests with no tenant context (superadmin/global routes, health) pass
 * through tenant-less. When a tenant IS resolved:
 *   - suspended (`isActive === false`) → 503
 *   - maintenance mode → 503 for authenticated students/instructors (admins pass
 *     so they can disable it; unauthenticated requests pass so login + the
 *     maintenance page still work).
 */
export const tenantResolver = asyncHandler(async (req, _res, next) => {
  const explicitId = req.header('x-tenant-id');
  const slugHeader = req.header('x-tenant-slug')?.toLowerCase();
  const [subdomain] = req.hostname.includes('.') ? req.hostname.split('.') : [];

  let tenant: ITenant | null = null;
  if (req.user) {
    tenant = await TenantService.resolveById(req.user.tenantId);
  } else if (explicitId) {
    if (!Types.ObjectId.isValid(explicitId)) throw ApiError.badRequest('Invalid x-tenant-id');
    tenant = await TenantService.resolveById(explicitId);
  } else if (slugHeader) {
    tenant = await TenantService.resolveBySlug(slugHeader);
  } else if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    tenant =
      (await TenantService.resolveBySlug(subdomain)) ??
      (await TenantService.resolveByDomain(req.hostname));
  } else if (req.hostname.includes('.')) {
    tenant = await TenantService.resolveByDomain(req.hostname);
  }

  if (!tenant) {
    if (req.user || explicitId || slugHeader) throw ApiError.notFound('Tenant not found');
    return next(); // no tenant hints → pass through (global/health routes)
  }

  if (!tenant.isActive) {
    throw new ApiError(503, 'This platform is currently suspended.');
  }

  req.tenant = tenant;
  req.tenantId = tenant._id.toString();

  if (req.user && (req.user.role === 'student' || req.user.role === 'instructor')) {
    const settings = await TenantSettings.findOne({ tenantId: tenant._id })
      .select('maintenanceMode')
      .lean();
    if (settings?.maintenanceMode) {
      throw new ApiError(503, 'This platform is under maintenance. Please check back soon.');
    }
  }

  next();
});
