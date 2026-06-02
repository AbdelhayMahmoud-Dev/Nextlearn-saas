import { Router } from 'express';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { MarketplaceController } from '../../controllers/marketplace.controller';

const router = Router();

// The marketplace is public but tenant-scoped (same as the course catalog).
router.use(tenantResolver, requireTenant);

router.get('/stats', MarketplaceController.stats);
router.get('/featured', MarketplaceController.featured);
router.get('/trending', MarketplaceController.trending);
router.get('/top-rated', MarketplaceController.topRated);
router.get('/categories', MarketplaceController.categories);
router.get('/instructors', MarketplaceController.instructors);
router.get('/instructors/:id', MarketplaceController.instructorProfile);

export default router;
