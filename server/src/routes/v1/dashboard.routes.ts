import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { DashboardController } from '../../controllers/dashboard.controller';

const router = Router();

router.use(authenticate);
router.get('/', DashboardController.student);

export default router;
