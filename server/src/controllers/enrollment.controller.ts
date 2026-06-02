import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/requestContext';
import { EnrollmentService } from '../services/enrollment.service';
import { EnrollInput } from '../validations/enrollment.validation';

export const EnrollmentController = {
  enroll: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId } = req.body as EnrollInput;
    const enrollment = await EnrollmentService.enroll(user.tenantId, user.id, courseId);
    ApiResponse.created(res, enrollment, 'Enrolled successfully');
  }),

  my: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const items = await EnrollmentService.listMy(user.tenantId, user.id);
    ApiResponse.success(res, items, 'My enrollments');
  }),

  status: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const data = await EnrollmentService.getStatus(user.tenantId, user.id, req.params.courseId);
    ApiResponse.success(res, data, 'Enrollment status');
  }),

  /** Enroll in a FREE course (no payment). Rejects paid courses with 400. */
  enrollFree: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId } = req.body as EnrollInput;
    const enrollment = await EnrollmentService.enrollFree(user.tenantId, user.id, courseId);
    ApiResponse.created(res, enrollment, 'Enrolled successfully');
  }),

  /** Returns { hasAccess, reason } for a whole course (non-throwing). */
  checkAccess: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await EnrollmentService.checkAccess(user.tenantId, user.id, req.params.courseId);
    ApiResponse.success(res, result, 'Access check');
  }),

  /** Per-lesson access check — 403 when the user must purchase the course. */
  lessonAccess: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, lessonId } = req.params;
    const result = await EnrollmentService.checkAccess(user.tenantId, user.id, courseId, lessonId);
    if (!result.hasAccess) {
      throw ApiError.forbidden('Purchase this course to access this lesson');
    }
    ApiResponse.success(res, result, 'Access granted');
  }),
};
