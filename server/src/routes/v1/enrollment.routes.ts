import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { EnrollmentController } from '../../controllers/enrollment.controller';
import { enrollSchema } from '../../validations/enrollment.validation';

const router = Router();

// Enrollment is always tied to the authenticated user (token carries the tenant).
router.use(authenticate);

router.post('/', validate(enrollSchema), EnrollmentController.enroll);
router.post('/free', validate(enrollSchema), EnrollmentController.enrollFree);
router.get('/my', EnrollmentController.my);
router.get('/my-courses', EnrollmentController.my); // spec alias
router.get('/check/:courseId', EnrollmentController.checkAccess);
router.get('/:courseId/access/:lessonId', EnrollmentController.lessonAccess);
router.get('/:courseId/status', EnrollmentController.status);

export default router;
