import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import { AffiliateController } from '../../controllers/affiliate.controller';
import { payoutEmailSchema, trackSchema } from '../../validations/affiliate.validation';

const router = Router();

// Public click tracking (tenant resolved from header/subdomain).
router.post('/track', tenantResolver, requireTenant, validate(trackSchema), AffiliateController.track);

// Affiliate self-service (authenticated; tenant comes from the token).
router.get('/me', authenticate, AffiliateController.dashboard);
router.patch(
  '/me/payout-email',
  authenticate,
  validate(payoutEmailSchema),
  AffiliateController.updatePayoutEmail,
);
router.get('/commissions', authenticate, AffiliateController.commissions);
router.get('/payouts', authenticate, AffiliateController.payouts);
router.post('/payouts/request', authenticate, AffiliateController.requestPayout);

export default router;
