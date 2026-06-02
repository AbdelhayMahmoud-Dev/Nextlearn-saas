import { Router } from 'express';
import { QuizController } from '../../controllers/quiz.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { validate } from '../../middleware/validate';
import { requireEnrollmentForQuiz } from '../../middleware/requireEnrollment';
import { createQuizSchema, updateQuizSchema, submitAttemptSchema } from '../../validations/quiz.validation';

const router = Router();

router.use(tenantResolver, requireTenant);

router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(createQuizSchema),
  QuizController.create,
);

// GET quiz — instructor sees full data, students see questions without answers
router.get('/:id', QuizController.get);

router.put(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  validate(updateQuizSchema),
  QuizController.update,
);

router.delete(
  '/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  QuizController.delete,
);

router.post(
  '/:id/attempts',
  authenticate,
  requireEnrollmentForQuiz,
  validate(submitAttemptSchema),
  QuizController.submitAttempt,
);

router.get(
  '/:id/attempts/my',
  authenticate,
  QuizController.getMyAttempts,
);

router.get(
  '/:id/attempts',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  QuizController.getAllAttempts,
);

export default router;
