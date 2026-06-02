import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { ApiError } from '../utils/ApiError';
import { Course } from '../models/Course.model';
import { Module } from '../models/Module.model';
import { Lesson } from '../models/Lesson.model';
import { Enrollment } from '../models/Enrollment.model';
import { Subscription } from '../models/Subscription.model';

/** Returns true if the user owns the course (is instructor) or is admin. */
async function isCourseOwner(
  tenantId: string,
  courseId: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin) return true;
  const course = await Course.findOne({ _id: courseId, tenantId }).select('instructorId').lean();
  return course?.instructorId.toString() === userId;
}

/** Checks whether a user has access to full lesson content. */
async function hasContentAccess(
  tenantId: string,
  courseId: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin) return true;
  const owner = await isCourseOwner(tenantId, courseId, userId, false);
  if (owner) return true;

  const [enrollment, subscription] = await Promise.all([
    Enrollment.exists({ tenantId, userId, courseId, status: 'active' }),
    Subscription.exists({ tenantId, userId, status: 'active' }),
  ]);
  return Boolean(enrollment ?? subscription);
}

export const LessonController = {
  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, moduleId } = req.params;

    if (!(await isCourseOwner(user.tenantId, courseId, user.id, user.role === 'admin' || user.role === 'superadmin'))) {
      throw ApiError.forbidden('You can only add lessons to your own courses');
    }

    const mod = await Module.findOne({ _id: moduleId, courseId, tenantId: user.tenantId }).lean();
    if (!mod) throw ApiError.notFound('Module not found');

    const count = await Lesson.countDocuments({ moduleId, tenantId: user.tenantId });
    const lesson = await Lesson.create({
      tenantId: user.tenantId,
      moduleId,
      courseId,
      order: req.body.order ?? count,
      ...req.body,
    });
    ApiResponse.created(res, lesson.toObject(), 'Lesson created');
  }),

  list: asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');

    const user = req.user;
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const owner = user
      ? await isCourseOwner(tenantId, req.params.courseId, user.id, isAdmin)
      : false;

    const filter = owner
      ? { moduleId, tenantId }
      : { moduleId, tenantId, isPublished: true };

    const lessons = await Lesson.find(filter).sort({ order: 1 }).lean();

    // Strip content from non-free locked lessons for non-owners
    const result = owner
      ? lessons
      : lessons.map((l) =>
          l.isFree
            ? l
            : { ...l, content: { duration: l.content?.duration ?? 0, attachments: [] }, isLocked: true },
        );

    ApiResponse.success(res, result, 'Lessons');
  }),

  get: asyncHandler(async (req, res) => {
    const { courseId, moduleId, id } = req.params;
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');

    const lesson = await Lesson.findOne({ _id: id, moduleId, courseId, tenantId }).lean();
    if (!lesson || !lesson.isPublished) throw ApiError.notFound('Lesson not found');

    // Free lesson — always return full content
    if (lesson.isFree) {
      return ApiResponse.success(res, lesson, 'Lesson');
    }

    const user = req.user;
    if (!user) {
      return ApiResponse.success(
        res,
        { ...lesson, content: { duration: lesson.content?.duration ?? 0, attachments: [] }, isLocked: true },
        'Lesson (locked)',
      );
    }

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const canAccess = await hasContentAccess(tenantId, courseId, user.id, isAdmin);

    if (!canAccess) {
      return ApiResponse.success(
        res,
        { ...lesson, content: { duration: lesson.content?.duration ?? 0, attachments: [] }, isLocked: true },
        'Lesson (locked)',
      );
    }

    return ApiResponse.success(res, lesson, 'Lesson');
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, moduleId, id } = req.params;

    if (!(await isCourseOwner(user.tenantId, courseId, user.id, user.role === 'admin' || user.role === 'superadmin'))) {
      throw ApiError.forbidden('You can only edit lessons in your own courses');
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: id, moduleId, courseId, tenantId: user.tenantId },
      { $set: req.body },
      { new: true },
    ).lean();
    if (!lesson) throw ApiError.notFound('Lesson not found');
    ApiResponse.success(res, lesson, 'Lesson updated');
  }),

  delete: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, moduleId, id } = req.params;

    if (!(await isCourseOwner(user.tenantId, courseId, user.id, user.role === 'admin' || user.role === 'superadmin'))) {
      throw ApiError.forbidden('You can only delete lessons in your own courses');
    }

    await Lesson.deleteOne({ _id: id, moduleId, courseId, tenantId: user.tenantId });
    ApiResponse.noContent(res);
  }),

  reorder: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, moduleId } = req.params;
    const { orderedIds } = req.body as { orderedIds: string[] };

    if (!(await isCourseOwner(user.tenantId, courseId, user.id, user.role === 'admin' || user.role === 'superadmin'))) {
      throw ApiError.forbidden('You can only reorder lessons in your own courses');
    }

    const found = await Lesson.find({
      _id: { $in: orderedIds.map((id) => new Types.ObjectId(id)) },
      moduleId,
      tenantId: user.tenantId,
    })
      .select('_id')
      .lean();

    if (found.length !== orderedIds.length) {
      throw ApiError.badRequest('One or more lesson IDs are invalid');
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Lesson.updateOne({ _id: id, moduleId, tenantId: user.tenantId }, { order: index }),
      ),
    );

    const lessons = await Lesson.find({ moduleId, tenantId: user.tenantId }).sort({ order: 1 }).lean();
    ApiResponse.success(res, lessons, 'Lessons reordered');
  }),

  publish: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, moduleId, id } = req.params;

    if (!(await isCourseOwner(user.tenantId, courseId, user.id, user.role === 'admin' || user.role === 'superadmin'))) {
      throw ApiError.forbidden('You can only publish lessons in your own courses');
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: id, moduleId, courseId, tenantId: user.tenantId },
      [{ $set: { isPublished: { $not: '$isPublished' } } }],
      { new: true },
    ).lean();
    if (!lesson) throw ApiError.notFound('Lesson not found');
    ApiResponse.success(res, lesson, 'Lesson publish status toggled');
  }),
};
