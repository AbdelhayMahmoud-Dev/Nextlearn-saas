import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { UserController } from '../../controllers/user.controller';
import { changePasswordSchema, updateProfileSchema } from '../../validations/user.validation';

const router = Router();

router.use(authenticate);
router.get('/me', UserController.me);
router.patch('/me', validate(updateProfileSchema), UserController.updateProfile);
router.post('/me/change-password', validate(changePasswordSchema), UserController.changePassword);
router.get('/me/sessions', UserController.sessions);
router.post('/me/sign-out-all', UserController.signOutEverywhere);

export default router;
