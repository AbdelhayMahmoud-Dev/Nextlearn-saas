import { Router } from 'express';
import { CourseController } from '../../controllers/course.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema } from '../../validations/course.validation';

const router = Router();

// All course routes are tenant-scoped.
router.use(tenantResolver, requireTenant);

// ── Public reads ─────────────────────────────────────────────────────────
router.get('/featured', CourseController.featured);
router.get('/categories', CourseController.categories);

// ── Instructor / admin writes ─────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createCourseSchema),
  CourseController.create,
);

router.get(
  '/my',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  CourseController.listMy,
);

// Public list (must come after /my and /featured to avoid route conflicts)
router.get('/', CourseController.list);

router.get(
  '/:id/edit',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  CourseController.getForEdit,
);

router.get(
  '/:id/analytics',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  CourseController.analytics,
);

router.put(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(updateCourseSchema),
  CourseController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  CourseController.delete,
);

router.patch(
  '/:id/publish',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  CourseController.publish,
);

router.patch(
  '/:id/unpublish',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  CourseController.unpublish,
);

router.patch(
  '/:id/feature',
  authenticate,
  requireRole('admin', 'superadmin'),
  CourseController.feature,
);

// Public detail by slug — must be last to avoid shadowing named routes above
router.get('/:slug', CourseController.detail);

export default router;
