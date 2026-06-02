import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { LearnController } from '../../controllers/learn.controller';

const router = Router();

router.use(authenticate);
router.get('/:courseId', LearnController.course);
router.get('/:courseId/lessons/:lessonId', LearnController.lesson);

export default router;
