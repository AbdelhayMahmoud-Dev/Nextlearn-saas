import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import { LiveSessionController } from '../../controllers/liveSession.controller';

const createSessionSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    scheduledAt: z.coerce.date(),
    duration: z.number().int().min(15).max(300).default(60),
    meetingUrl: z.string().url(),
    description: z.string().max(2000).optional(),
  }),
});

const router = Router();

router.use(tenantResolver, requireTenant);

// Public
router.get('/', LiveSessionController.list);
router.get('/:id', LiveSessionController.get);

// Authenticated student-facing
router.get('/upcoming', authenticate, LiveSessionController.upcoming);
router.post('/:id/join', authenticate, LiveSessionController.join);

// Instructor writes
router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createSessionSchema),
  LiveSessionController.create,
);

router.put(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createSessionSchema.partial()),
  LiveSessionController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  LiveSessionController.cancel,
);

router.patch(
  '/:id/start',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  LiveSessionController.start,
);

router.patch(
  '/:id/end',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  LiveSessionController.end,
);

export default router;
