import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { SuperAdminController } from '../../controllers/superadmin.controller';
import {
  createTenantSchema,
  updatePlanSchema,
  toggleTenantStatusSchema,
  deleteTenantSchema,
} from '../../validations/tenant.validation';

const router = Router();

// Cross-tenant routes — SUPERADMIN ONLY (never plain admin).
router.use(authenticate, requireRole('superadmin'));

router.get('/ops', SuperAdminController.opsStatus);
router.get('/analytics', SuperAdminController.globalAnalytics);
router.get('/tenants', SuperAdminController.listTenants);
router.post('/tenants', validate(createTenantSchema), SuperAdminController.createTenant);
router.get('/tenants/:id', SuperAdminController.getTenant);
router.patch('/tenants/:id/status', validate(toggleTenantStatusSchema), SuperAdminController.toggleStatus);
router.patch('/tenants/:id/plan', validate(updatePlanSchema), SuperAdminController.updatePlan);
router.delete('/tenants/:id', validate(deleteTenantSchema), SuperAdminController.deleteTenant);

export default router;
