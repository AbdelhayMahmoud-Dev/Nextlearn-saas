import { Router } from 'express';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { ReviewController } from '../../controllers/review.controller';
import { createReviewSchema } from '../../validations/review.validation';

const router = Router();

router.get('/featured', tenantResolver, requireTenant, ReviewController.featured);
router.get('/course/:courseId', tenantResolver, requireTenant, ReviewController.forCourse);
router.post('/', authenticate, validate(createReviewSchema), ReviewController.create);

export default router;
