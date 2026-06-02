import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { authLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../validations/auth.validation';

const router = Router();

router.post(
  '/register',
  authLimiter,
  tenantResolver,
  requireTenant,
  validate(registerSchema),
  AuthController.register,
);
router.post(
  '/login',
  authLimiter,
  tenantResolver,
  requireTenant,
  validate(loginSchema),
  AuthController.login,
);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post(
  '/forgot-password',
  authLimiter,
  tenantResolver,
  requireTenant,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/me', authenticate, AuthController.me);

// Device-session management + login history. The refresh cookie is scoped to
// /api/v1/auth, so these endpoints can identify the requesting device.
router.get('/sessions', authenticate, AuthController.listSessions);
router.delete('/sessions/:id', authenticate, AuthController.revokeSession);
router.post('/sessions/revoke-all', authenticate, AuthController.revokeAllSessions);
router.get('/login-history', authenticate, AuthController.loginHistory);

export default router;
