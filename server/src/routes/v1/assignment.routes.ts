import { Router } from 'express';
import { z } from 'zod';
import { AssignmentController } from '../../controllers/assignment.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import { requireEnrollmentForAssignment } from '../../middleware/requireEnrollment';

const createAssignmentSchema = z.object({
  body: z.object({
    lessonId: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    description: z.string().default(''),
    rubric: z
      .array(
        z.object({
          criterion: z.string().min(1),
          description: z.string().optional(),
          maxPoints: z.number().min(0),
        }),
      )
      .default([]),
    dueDate: z.coerce.date().optional(),
    maxScore: z.number().min(0).default(100),
    allowLate: z.boolean().default(true),
    latePenaltyPercent: z.number().min(0).max(100).default(0),
  }),
});

const submitSchema = z.object({
  body: z.object({
    content: z.string().max(50_000).default(''),
    attachments: z
      .array(
        z.object({
          name: z.string().min(1),
          url: z.string().url(),
          mimeType: z.string().optional(),
          size: z.number().optional(),
        }),
      )
      .max(10)
      .default([]),
  }),
});

const gradeSchema = z.object({
  body: z.object({
    score: z.number().min(0),
    feedback: z.string().max(5000).optional(),
  }),
});

const router = Router();

router.use(tenantResolver, requireTenant);

router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createAssignmentSchema),
  AssignmentController.create,
);

router.get('/:id', AssignmentController.get);

router.put(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createAssignmentSchema.partial()),
  AssignmentController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  AssignmentController.delete,
);

router.post(
  '/:id/submissions',
  authenticate,
  requireEnrollmentForAssignment,
  validate(submitSchema),
  AssignmentController.submit,
);

router.get(
  '/:id/submissions',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  AssignmentController.listSubmissions,
);

router.get(
  '/:id/submissions/my',
  authenticate,
  AssignmentController.getMySubmission,
);

router.put(
  '/:id/submissions/:subId',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(gradeSchema),
  AssignmentController.grade,
);

export default router;
