import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getTenantId, getAuthUser } from '../utils/requestContext';
import { buildPaginationMeta } from '../utils/pagination';
import { CourseService } from '../services/course.service';
import { listCoursesQuerySchema } from '../validations/course.validation';

export const CourseController = {
  // ── Public ────────────────────────────────────────────────────────────────

  list: asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const query = listCoursesQuerySchema.parse(req.query);
    const { items, total } = await CourseService.list(tenantId, query);
    ApiResponse.success(
      res,
      items,
      'Courses',
      200,
      buildPaginationMeta(total, query.page, query.limit),
    );
  }),

  featured: asyncHandler(async (req, res) => {
    const items = await CourseService.featured(getTenantId(req));
    ApiResponse.success(res, items, 'Featured courses');
  }),

  categories: asyncHandler(async (req, res) => {
    const items = await CourseService.categories(getTenantId(req));
    ApiResponse.success(res, items, 'Categories');
  }),

  detail: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const course = await CourseService.getBySlug(getTenantId(req), req.params.slug, userId);
    ApiResponse.success(res, course, 'Course');
  }),

  // ── Instructor / admin ────────────────────────────────────────────────────

  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const course = await CourseService.create(user.tenantId, user.id, req.body);
    ApiResponse.created(res, course, 'Course created');
  }),

  listMy: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const items = await CourseService.listForInstructor(user.tenantId, user.id);
    ApiResponse.success(res, items, 'My courses');
  }),

  getForEdit: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const course = await CourseService.getForEdit(
      user.tenantId,
      req.params.id,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );
    ApiResponse.success(res, course, 'Course');
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const course = await CourseService.update(
      user.tenantId,
      req.params.id,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
      req.body,
    );
    ApiResponse.success(res, course, 'Course updated');
  }),

  delete: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await CourseService.delete(
      user.tenantId,
      req.params.id,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );
    ApiResponse.noContent(res);
  }),

  publish: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const course = await CourseService.publish(
      user.tenantId,
      req.params.id,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );
    ApiResponse.success(res, course, 'Course published');
  }),

  unpublish: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const course = await CourseService.unpublish(
      user.tenantId,
      req.params.id,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );
    ApiResponse.success(res, course, 'Course unpublished');
  }),

  feature: asyncHandler(async (req, res) => {
    const course = await CourseService.feature(getTenantId(req), req.params.id);
    ApiResponse.success(res, course, 'Course feature status toggled');
  }),

  analytics: asyncHandler(async (req, res) => {
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
