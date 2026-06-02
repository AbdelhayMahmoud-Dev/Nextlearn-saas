import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { CouponController } from '../../controllers/coupon.controller';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from '../../validations/coupon.validation';

const router = Router();

router.use(authenticate);

// Any authenticated user may validate a coupon at checkout.
router.post('/validate', validate(validateCouponSchema), CouponController.validate);

// Admin coupon management.
router.post('/', requireRole('admin', 'superadmin'), validate(createCouponSchema), CouponController.create);
router.get('/', requireRole('admin', 'superadmin'), CouponController.list);
router.put('/:id', requireRole('admin', 'superadmin'), validate(updateCouponSchema), CouponController.update);
router.delete('/:id', requireRole('admin', 'superadmin'), CouponController.delete);

export default router;
