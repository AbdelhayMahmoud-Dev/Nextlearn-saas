import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { PaymentController } from '../../controllers/payment.controller';
import { checkoutSchema, subscribeSchema } from '../../validations/payment.validation';

const router = Router();

// Every payment action is tied to the authenticated user (token carries tenant).
router.use(authenticate);

router.post('/checkout', validate(checkoutSchema), PaymentController.checkout);
router.post('/subscribe', validate(subscribeSchema), PaymentController.subscribe);
router.get('/portal', PaymentController.portal);
router.get('/history', PaymentController.history);
router.get('/subscription', PaymentController.subscription);
router.get('/verify-session', PaymentController.verifySession);

export default router;
