import { Router } from 'express';
import { tenantResolver } from '../../middleware/tenantResolver';
import { validate } from '../../middleware/validate';
import { tenantSignupLimiter } from '../../middleware/rateLimiter';
import { TenantController } from '../../controllers/tenant.controller';
import { tenantSignupSchema } from '../../validations/tenant.validation';

const router = Router();

// Public branding/config — resolves the tenant from subdomain/domain/header.
router.get('/config', tenantResolver, TenantController.config);

// Public self-onboarding (rate-limited to 3/hour/IP).
router.post('/signup', tenantSignupLimiter, validate(tenantSignupSchema), TenantController.signup);

export default router;
