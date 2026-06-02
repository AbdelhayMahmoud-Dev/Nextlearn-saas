import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getTenantId, getAuthUser } from '../utils/requestContext';
import { buildPaginationMeta } from '../utils/pagination';
import { AnalyticsService } from '../services/analytics.service';
import { CourseService } from '../services/course.service';

export const AnalyticsController = {
  publicStats: asyncHandler(async (req, res) => {
    const data = await AnalyticsService.publicStats(getTenantId(req));
    ApiResponse.success(res, data, 'Platform stats');
  }),

  instructorDashboard: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await AnalyticsService.instructorDashboard(user.tenantId, user.id);
    ApiResponse.success(res, data, 'Instructor dashboard');
  }),

  instructorRevenue: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await AnalyticsService.instructorRevenue(user.tenantId, user.id);
    ApiResponse.success(res, data, 'Revenue');
  }),

  instructorStudents: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const courseId = req.query.courseId as string | undefined;
    const q = req.query.q as string | undefined;

    const { items, total } = await AnalyticsService.instructorStudents(user.tenantId, user.id, {
      courseId,
      q,
      page,
      limit,
    });
    ApiResponse.success(res, items, 'Students', 200, buildPaginationMeta(total, page, limit));
  }),

  courseAnalytics: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await CourseService.getAnalytics(
      user.tenantId,
      req.params.id,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );
    ApiResponse.success(res, data, 'Course analytics');
  }),
};
