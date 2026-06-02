import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { AdminController } from '../../controllers/admin.controller';
import {
  changeRoleSchema,
  toggleStatusSchema,
  rejectCourseSchema,
  refundPaymentSchema,
  updateBrandingSchema,
  updateGeneralSchema,
} from '../../validations/admin.validation';

const router = Router();

// Every admin route requires an authenticated admin (or superadmin).
router.use(authenticate, requireRole('admin', 'superadmin'));

// ── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics/kpis', AdminController.kpis);
router.get('/analytics/revenue-chart', AdminController.revenueChart);
router.get('/analytics/user-growth', AdminController.userGrowth);
router.get('/analytics/top-courses', AdminController.topCourses);
router.get('/analytics/categories', AdminController.categories);

// ── Advanced Analytics (retention, funnels, cohorts, forecasting) ────────────
router.get('/analytics/funnel', AdminController.analyticsFunnel);
router.get('/analytics/cohorts', AdminController.analyticsCohorts);
router.get('/analytics/retention', AdminController.analyticsRetention);
router.get('/analytics/forecast', AdminController.analyticsForecast);
router.get('/analytics/course-performance', AdminController.analyticsCoursePerformance);
router.get('/analytics/instructor-performance', AdminController.analyticsInstructorPerformance);

// ── Users ────────────────────────────────────────────────────────────────
router.get('/users', AdminController.listUsers);
router.post('/users/export', AdminController.exportUsers);
router.get('/users/:id', AdminController.getUser);
router.patch('/users/:id/role', validate(changeRoleSchema), AdminController.changeRole);
router.patch('/users/:id/status', validate(toggleStatusSchema), AdminController.toggleStatus);
router.delete('/users/:id', AdminController.deleteUser);

// ── Courses ──────────────────────────────────────────────────────────────
router.get('/courses', AdminController.listCourses);
router.get('/courses/:id', AdminController.getCourse);
router.patch('/courses/:id/feature', AdminController.featureCourse);
router.patch('/courses/:id/approve', AdminController.approveCourse);
router.patch('/courses/:id/reject', validate(rejectCourseSchema), AdminController.rejectCourse);
router.delete('/courses/:id', AdminController.deleteCourse);

// ── Payments + Subscriptions ───────────────────────────────────────────────
router.get('/payments', AdminController.listPayments);
router.get('/subscriptions', AdminController.listSubscriptions);
router.get('/payments/:id', AdminController.getPayment);
router.post('/payments/:id/refund', validate(refundPaymentSchema), AdminController.refundPayment);

// ── Coupons ────────────────────────────────────────────────────────────────
router.get('/coupons/analytics', AdminController.couponAnalytics);

// ── Settings + Branding ─────────────────────────────────────────────────────
router.get('/settings', AdminController.getSettings);
router.get('/settings/branding', AdminController.getBranding);
router.put('/settings/branding', validate(updateBrandingSchema), AdminController.updateBranding);
router.put('/settings/general', validate(updateGeneralSchema), AdminController.updateGeneral);

// ── Security + Audit ─────────────────────────────────────────────────────────
router.get('/security/audit-logs', AdminController.auditLogs);
router.get('/security/events', AdminController.securityEvents);

// ── Stripe Connect (payouts) ─────────────────────────────────────────────────
router.post('/stripe/connect', AdminController.stripeConnect);
router.post('/stripe/onboarding-link', AdminController.stripeOnboardingLink);
router.post('/stripe/login-link', AdminController.stripeLoginLink);
router.get('/stripe/status', AdminController.stripeStatus);

export default router;
