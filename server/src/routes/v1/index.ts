import { Router } from 'express';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import moduleRoutes from './module.routes';
import lessonRoutes from './lesson.routes';
import enrollmentRoutes from './enrollment.routes';
import progressRoutes from './progress.routes';
import learnRoutes from './learn.routes';
import dashboardRoutes from './dashboard.routes';
import certificateRoutes from './certificate.routes';
import analyticsRoutes from './analytics.routes';
import reviewRoutes from './review.routes';
import notificationRoutes from './notification.routes';
import userRoutes from './user.routes';
import liveSessionRoutes from './liveSession.routes';
import quizRoutes from './quiz.routes';
import assignmentRoutes from './assignment.routes';
import uploadRoutes from './upload.routes';
import paymentRoutes from './payment.routes';
import couponRoutes from './coupon.routes';
import adminRoutes from './admin.routes';
import tenantRoutes from './tenant.routes';
import superadminRoutes from './superadmin.routes';
import aiRoutes from './ai.routes';
import marketplaceRoutes from './marketplace.routes';

const router = Router();

/** Liveness/readiness probe. */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'NextLearn API is healthy',
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
// Module and lesson routes are nested under courses
router.use('/courses/:courseId/modules', moduleRoutes);
router.use('/courses/:courseId/modules/:moduleId/lessons', lessonRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/progress', progressRoutes);
router.use('/learn', learnRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/certificates', certificateRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/live-sessions', liveSessionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/upload', uploadRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/admin', adminRoutes);
// Public white-label endpoints: GET /tenant/config (branding) + POST /tenant/signup
router.use('/tenant', tenantRoutes);
// Cross-tenant SuperAdmin endpoints (/superadmin/*)
router.use('/superadmin', superadminRoutes);
// AI Learning Assistant (tutor chat, summaries, quiz explanations, feedback)
router.use('/ai', aiRoutes);
// Public marketplace (featured/trending/top-rated courses, instructor directory)
router.use('/marketplace', marketplaceRoutes);

export default router;
