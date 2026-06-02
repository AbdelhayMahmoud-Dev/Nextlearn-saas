import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { requireEnrollment } from '../../middleware/requireEnrollment';
import { ProgressController } from '../../controllers/progress.controller';
import { markProgressSchema } from '../../validations/progress.validation';

const router = Router();

router.use(authenticate);
router.post('/', validate(markProgressSchema), ProgressController.mark);
router.get('/:courseId', requireEnrollment, ProgressController.byCourse);

export default router;
