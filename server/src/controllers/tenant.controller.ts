import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { TenantSettings } from '../models/TenantSettings.model';
import { WhiteLabel } from '../models/WhiteLabel.model';
import { User } from '../models/User.model';
import { TenantService } from '../services/tenant.service';
import type { TenantSignupBody } from '../validations/tenant.validation';

export const TenantController = {
  /** Public tenant config consumed on every page load to apply branding. */
  config: asyncHandler(async (req, res) => {
    const tenant = req.tenant;
    if (!tenant) throw ApiError.badRequest('Tenant context is required');

    const [settings, wl] = await Promise.all([
      TenantSettings.findOne({ tenantId: tenant._id }).lean(),
      WhiteLabel.findOne({ tenantId: tenant._id }).lean(),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=60');
    ApiResponse.success(res, {
      tenantId: tenant._id.toString(),
      platformName: settings?.platformName ?? tenant.name,
      slug: tenant.slug,
      branding: {
        logo: wl?.logo ?? tenant.branding?.logo,
        primaryColor: wl?.primaryColor ?? tenant.branding?.primaryColor ?? '#6366f1',
        accentColor: wl?.accentColor ?? tenant.branding?.accentColor ?? '#8b5cf6',
        font: tenant.branding?.font ?? 'inter',
      },
      features: {
        enableCoupons: wl?.features?.coupons ?? true,
        enableSubscriptions: true,
        enableCertificates: wl?.features?.certificates ?? true,
        enableLiveSession: wl?.features?.liveSessions ?? true,
        maxCoursesVisible: 1000,
      },
      plan: tenant.plan,
      isActive: tenant.isActive,
      maintenanceMode: settings?.maintenanceMode ?? false,
    });
  }),

  /** Public self-onboarding: creates a new tenant + admin (credentials emailed). */
  signup: asyncHandler(async (req, res) => {
    const body = req.body as TenantSignupBody;

    const existingAdmin = await User.findOne({ email: body.adminEmail, role: 'admin' }).lean();
    if (existingAdmin) {
      throw ApiError.conflict('This email already administers another platform');
    }

    await TenantService.createTenant({
      name: body.orgName,
      slug: body.slug,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      plan: 'free',
    });

    ApiResponse.created(
      res,
      { tenantSlug: body.slug },
      'Check your email for login credentials',
    );
  }),
};
