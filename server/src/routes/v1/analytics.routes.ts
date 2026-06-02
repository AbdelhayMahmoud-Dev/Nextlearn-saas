import { Router } from 'express';
import { tenantResolver } from '../../middleware/tenantResolver';
import { requireTenant } from '../../middleware/requireTenant';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { AnalyticsController } from '../../controllers/analytics.controller';

const router = Router();

router.use(tenantResolver, requireTenant);

// Public: homepage stats
router.get('/dashboard', AnalyticsController.publicStats);

// Instructor analytics
router.get(
  '/instructor/dashboard',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  AnalyticsController.instructorDashboard,
);

router.get(
  '/instructor/revenue',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  AnalyticsController.instructorRevenue,
);

router.get(
  '/instructor/students',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  AnalyticsController.instructorStudents,
);

// Per-course analytics (also available at /courses/:id/analytics via course controller)
router.get(
  '/courses/:id',
  authenticate,
  requireRole('instructor', 'admin', 'superadmin'),
  AnalyticsController.courseAnalytics,
);

export default router;
