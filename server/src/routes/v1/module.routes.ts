import { Router } from 'express';
import { ModuleController } from '../../controllers/module.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import {
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
} from '../../validations/module.validation';

const router = Router({ mergeParams: true }); // inherit :courseId from parent

// Tenant context needed for all module routes
router.use(tenantResolver, requireTenant);

// Public: list modules for a course (published only for anonymous users)
router.get('/', ModuleController.list);

// Instructor+ writes
router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createModuleSchema),
  ModuleController.create,
);

router.patch(
  '/reorder',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(reorderModulesSchema),
  ModuleController.reorder,
);

router.put(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(updateModuleSchema),
  ModuleController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  ModuleController.delete,
);

router.patch(
  '/:id/publish',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  ModuleController.publish,
);

export default router;
