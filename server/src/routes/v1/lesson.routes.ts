import { Router } from 'express';
import { LessonController } from '../../controllers/lesson.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import { sanitizeRichText } from '../../middleware/sanitizeRichText';
import { createLessonSchema, updateLessonSchema, reorderLessonsSchema } from '../../validations/lesson.validation';

const router = Router({ mergeParams: true }); // inherit :courseId and :moduleId

router.use(tenantResolver, requireTenant);

// Public: list published lessons
router.get('/', LessonController.list);

// Public: get a single lesson (access-checked inside handler)
router.get('/:id', LessonController.get);

// Instructor writes — sanitizeRichText applied to create/update ONLY
router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  sanitizeRichText,
  validate(createLessonSchema),
  LessonController.create,
);

router.patch(
  '/reorder',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(reorderLessonsSchema),
  LessonController.reorder,
);

router.put(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  sanitizeRichText,
  validate(updateLessonSchema),
  LessonController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  LessonController.delete,
);

router.patch(
  '/:id/publish',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  LessonController.publish,
);

export default router;
