import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { TenantService } from '../services/tenant.service';
import type { CreateTenantBodyInput } from '../validations/tenant.validation';

export const SuperAdminController = {
  listTenants: asyncHandler(async (req, res) => {
    const { items, meta } = await TenantService.listTenants(req.query);
    ApiResponse.success(res, items, 'Tenants', 200, meta);
  }),

  createTenant: asyncHandler(async (req, res) => {
    const body = req.body as CreateTenantBodyInput;
    const result = await TenantService.createTenant(body);
    // Never echo the temporary password back — it is delivered by email.
    ApiResponse.created(
      res,
      { tenant: result.tenant, adminEmail: result.adminUser.email },
      'Tenant created — credentials sent by email',
    );
  }),

  getTenant: asyncHandler(async (req, res) => {
    const data = await TenantService.getTenant(req.params.id);
    ApiResponse.success(res, data, 'Tenant');
  }),

  toggleStatus: asyncHandler(async (req, res) => {
    const tenant = await TenantService.toggleTenantStatus(req.params.id, req.body.isActive);
    ApiResponse.success(res, tenant, 'Tenant status updated');
  }),

  updatePlan: asyncHandler(async (req, res) => {
    const tenant = await TenantService.updateTenantPlan(
      req.params.id,
      req.body.plan,
      req.body.planExpiresAt ?? undefined,
    );
    ApiResponse.success(res, tenant, 'Tenant plan updated');
  }),

  deleteTenant: asyncHandler(async (req, res) => {
    await TenantService.deleteTenant(req.params.id, req.body.confirmSlug);
    ApiResponse.noContent(res);
  }),

  globalAnalytics: asyncHandler(async (_req, res) => {
    const data = await TenantService.getGlobalAnalytics();
    ApiResponse.success(res, data, 'Global analytics');
  }),
};
