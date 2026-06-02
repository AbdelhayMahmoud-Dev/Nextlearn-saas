import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { env } from '../config/env';
import { getAuthUser, getRequestContext, getTenantId } from '../utils/requestContext';
import { StripeConnectService } from '../services/stripeConnect.service';
import { AdminAnalyticsService } from '../services/admin.analytics.service';
import { AdminUserService } from '../services/admin.user.service';
import { AdminCourseService } from '../services/admin.course.service';
import { AdminPaymentService } from '../services/admin.payment.service';
import { AdminSettingsService } from '../services/admin.settings.service';
import { PaymentService } from '../services/payment.service';
import { CourseService } from '../services/course.service';
import { CouponService } from '../services/coupon.service';
import { AuditService } from '../services/audit.service';
import { SecurityService } from '../services/security.service';
import { AdminAdvancedAnalyticsService } from '../services/admin.advancedAnalytics.service';

export const AdminController = {
  // ── Analytics ───────────────────────────────────────────────────────────
  kpis: asyncHandler(async (req, res) => {
    const data = await AdminAnalyticsService.getDashboardKPIs(getTenantId(req));
    ApiResponse.success(res, data, 'KPIs');
  }),
  revenueChart: asyncHandler(async (req, res) => {
    const data = await AdminAnalyticsService.getRevenueChart(getTenantId(req));
    ApiResponse.success(res, data, 'Revenue chart');
  }),
  userGrowth: asyncHandler(async (req, res) => {
    const data = await AdminAnalyticsService.getUserGrowthChart(getTenantId(req));
    ApiResponse.success(res, data, 'User growth');
  }),
  topCourses: asyncHandler(async (req, res) => {
    const data = await AdminAnalyticsService.getTopCourses(getTenantId(req));
    ApiResponse.success(res, data, 'Top courses');
  }),
  categories: asyncHandler(async (req, res) => {
    const data = await AdminAnalyticsService.getCategoryBreakdown(getTenantId(req));
    ApiResponse.success(res, data, 'Category breakdown');
  }),

  // ── Users ───────────────────────────────────────────────────────────────
  listUsers: asyncHandler(async (req, res) => {
    const { items, meta } = await AdminUserService.listUsers(getTenantId(req), req.query);
    ApiResponse.success(res, items, 'Users', 200, meta);
  }),
  getUser: asyncHandler(async (req, res) => {
    const data = await AdminUserService.getUser(getTenantId(req), req.params.id);
    ApiResponse.success(res, data, 'User');
  }),
  changeRole: asyncHandler(async (req, res) => {
    const me = getAuthUser(req);
    const ctx = getRequestContext(req);
    const user = await AdminUserService.changeRole(me.tenantId, me.id, req.params.id, req.body.role);
    await AuditService.record({
      tenantId: me.tenantId,
      actorId: me.id,
      actorRole: me.role,
      action: 'user.role_changed',
      targetType: 'user',
      targetId: req.params.id,
      metadata: { role: req.body.role },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    ApiResponse.success(res, user, 'Role updated');
  }),
  toggleStatus: asyncHandler(async (req, res) => {
    const me = getAuthUser(req);
    const ctx = getRequestContext(req);
    const user = await AdminUserService.toggleStatus(me.tenantId, me.id, req.params.id, req.body.isActive);
    await AuditService.record({
      tenantId: me.tenantId,
      actorId: me.id,
      actorRole: me.role,
      action: req.body.isActive ? 'user.activated' : 'user.deactivated',
      targetType: 'user',
      targetId: req.params.id,
      metadata: { isActive: req.body.isActive },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    ApiResponse.success(res, user, 'Status updated');
  }),
  deleteUser: asyncHandler(async (req, res) => {
    const me = getAuthUser(req);
    const ctx = getRequestContext(req);
    await AdminUserService.deleteUser(me.tenantId, me.id, req.params.id);
    await AuditService.record({
      tenantId: me.tenantId,
      actorId: me.id,
      actorRole: me.role,
      action: 'user.deleted',
      targetType: 'user',
      targetId: req.params.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    ApiResponse.noContent(res);
  }),
  exportUsers: asyncHandler(async (req, res) => {
    const csv = await AdminUserService.exportCsv(getTenantId(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.status(200).send(csv);
  }),

  // ── Courses ─────────────────────────────────────────────────────────────
  listCourses: asyncHandler(async (req, res) => {
    const { items, meta } = await AdminCourseService.listAllCourses(getTenantId(req), req.query);
    ApiResponse.success(res, items, 'Courses', 200, meta);
  }),
  getCourse: asyncHandler(async (req, res) => {
    const data = await AdminCourseService.getCourse(getTenantId(req), req.params.id);
    ApiResponse.success(res, data, 'Course');
  }),
  featureCourse: asyncHandler(async (req, res) => {
    const course = await CourseService.feature(getTenantId(req), req.params.id);
    ApiResponse.success(res, course, 'Feature status toggled');
  }),
  approveCourse: asyncHandler(async (req, res) => {
    const course = await AdminCourseService.approveCourse(getTenantId(req), req.params.id);
    ApiResponse.success(res, course, 'Course approved');
  }),
  rejectCourse: asyncHandler(async (req, res) => {
    const course = await AdminCourseService.rejectCourse(getTenantId(req), req.params.id, req.body.reason);
    ApiResponse.success(res, course, 'Course rejected');
  }),
  deleteCourse: asyncHandler(async (req, res) => {
    const me = getAuthUser(req);
    const ctx = getRequestContext(req);
    await AdminCourseService.deleteCourse(me.tenantId, req.params.id);
    await AuditService.record({
      tenantId: me.tenantId,
      actorId: me.id,
      actorRole: me.role,
      action: 'course.deleted',
      targetType: 'course',
      targetId: req.params.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    ApiResponse.noContent(res);
  }),

  // ── Payments ────────────────────────────────────────────────────────────
  listPayments: asyncHandler(async (req, res) => {
    const { items, meta } = await AdminPaymentService.listPayments(getTenantId(req), req.query);
    ApiResponse.success(res, items, 'Payments', 200, meta);
  }),
  getPayment: asyncHandler(async (req, res) => {
    const data = await AdminPaymentService.getPayment(getTenantId(req), req.params.id);
    ApiResponse.success(res, data, 'Payment');
  }),
  refundPayment: asyncHandler(async (req, res) => {
    const me = getAuthUser(req);
    const ctx = getRequestContext(req);
    await PaymentService.adminRefund(me.tenantId, req.params.id, req.body.reason);
    await AuditService.record({
      tenantId: me.tenantId,
      actorId: me.id,
      actorRole: me.role,
      action: 'payment.refunded',
      targetType: 'payment',
      targetId: req.params.id,
      metadata: { reason: req.body.reason },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    ApiResponse.success(res, null, 'Refund processed');
  }),
  listSubscriptions: asyncHandler(async (req, res) => {
    const { items, meta } = await AdminPaymentService.listSubscriptions(getTenantId(req), req.query);
    ApiResponse.success(res, items, 'Subscriptions', 200, meta);
  }),

  // ── Coupons ─────────────────────────────────────────────────────────────
  couponAnalytics: asyncHandler(async (req, res) => {
    const data = await CouponService.couponAnalytics(getTenantId(req));
    ApiResponse.success(res, data, 'Coupon analytics');
  }),

  // ── Settings + Branding ─────────────────────────────────────────────────
  getSettings: asyncHandler(async (req, res) => {
    const data = await AdminSettingsService.getSettings(getTenantId(req));
    ApiResponse.success(res, data, 'Settings');
  }),
  getBranding: asyncHandler(async (req, res) => {
    const data = await AdminSettingsService.getBranding(getTenantId(req));
    ApiResponse.success(res, data, 'Branding');
  }),
  updateBranding: asyncHandler(async (req, res) => {
    const data = await AdminSettingsService.updateBranding(getTenantId(req), req.body);
    ApiResponse.success(res, data, 'Branding updated');
  }),
  updateGeneral: asyncHandler(async (req, res) => {
    const data = await AdminSettingsService.updateGeneral(getTenantId(req), req.body);
    ApiResponse.success(res, data, 'Settings updated');
  }),

  // ── Stripe Connect (payouts) ────────────────────────────────────────────
  stripeConnect: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await StripeConnectService.createConnectAccount(user.tenantId, user.email);
    ApiResponse.success(res, result, 'Stripe Connect account created');
  }),
  stripeOnboardingLink: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const url = `${env.CLIENT_URL}/admin/settings/stripe`;
    const result = await StripeConnectService.createOnboardingLink(user.tenantId, url, url);
    ApiResponse.success(res, result, 'Onboarding link created');
  }),
  stripeLoginLink: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await StripeConnectService.createLoginLink(user.tenantId);
    ApiResponse.success(res, result, 'Login link created');
  }),
  stripeStatus: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await StripeConnectService.syncAccountStatus(user.tenantId);
    ApiResponse.success(res, result, 'Stripe status');
  }),

  // ── Advanced Analytics ────────────────────────────────────────────────────
  analyticsFunnel: asyncHandler(async (req, res) => {
    const data = await AdminAdvancedAnalyticsService.funnel(getTenantId(req));
    ApiResponse.success(res, data, 'Conversion funnel');
  }),
  analyticsCohorts: asyncHandler(async (req, res) => {
    const data = await AdminAdvancedAnalyticsService.cohorts(getTenantId(req));
    ApiResponse.success(res, data, 'Signup cohorts');
  }),
  analyticsRetention: asyncHandler(async (req, res) => {
    const data = await AdminAdvancedAnalyticsService.retention(getTenantId(req));
    ApiResponse.success(res, data, 'Retention');
  }),
  analyticsForecast: asyncHandler(async (req, res) => {
    const data = await AdminAdvancedAnalyticsService.revenueForecast(getTenantId(req));
    ApiResponse.success(res, data, 'Revenue forecast');
  }),
  analyticsCoursePerformance: asyncHandler(async (req, res) => {
    const data = await AdminAdvancedAnalyticsService.coursePerformance(getTenantId(req));
    ApiResponse.success(res, data, 'Course performance');
  }),
  analyticsInstructorPerformance: asyncHandler(async (req, res) => {
    const data = await AdminAdvancedAnalyticsService.instructorPerformance(getTenantId(req));
    ApiResponse.success(res, data, 'Instructor performance');
  }),

  // ── Security + Audit ──────────────────────────────────────────────────────
  auditLogs: asyncHandler(async (req, res) => {
    const { items, meta } = await AuditService.list(getTenantId(req), req.query);
    ApiResponse.success(res, items, 'Audit logs', 200, meta);
  }),
  securityEvents: asyncHandler(async (req, res) => {
    const { items, meta } = await SecurityService.listEvents(getTenantId(req), req.query);
    ApiResponse.success(res, items, 'Security events', 200, meta);
  }),
};
