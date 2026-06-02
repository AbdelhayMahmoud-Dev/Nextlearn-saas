import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { ApiError } from '../utils/ApiError';
import { Course } from '../models/Course.model';
import { Module } from '../models/Module.model';
import { Lesson } from '../models/Lesson.model';

/** Verify the requesting user owns this course (or is admin). */
async function assertCourseAccess(
  tenantId: string,
  courseId: string,
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  const course = await Course.findOne({ _id: courseId, tenantId }).select('instructorId').lean();
  if (!course) throw ApiError.notFound('Course not found');
  if (!isAdmin && course.instructorId.toString() !== userId) {
    throw ApiError.forbidden('You can only manage modules of your own courses');
  }
}

export const ModuleController = {
  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId } = req.params;
    await assertCourseAccess(
      user.tenantId,
      courseId,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );

    const count = await Module.countDocuments({ courseId, tenantId: user.tenantId });
    const module = await Module.create({
      tenantId: user.tenantId,
      courseId,
      title: req.body.title,
      order: count,
    });
    ApiResponse.created(res, module.toObject(), 'Module created');
  }),

  list: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const user = req.user;
    const tenantId = req.tenantId ?? user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');

    const isOwner =
      user &&
      (user.role === 'admin' ||
        user.role === 'superadmin' ||
        (await Course.exists({ _id: courseId, instructorId: user.id, tenantId })));

    const filter = isOwner
      ? { courseId, tenantId }
      : { courseId, tenantId, isPublished: true };

    const modules = await Module.find(filter).sort({ order: 1 }).lean();

    // Attach lessons to each module
    const lessons = await Lesson.find({
      moduleId: { $in: modules.map((m) => m._id) },
      ...(isOwner ? {} : { isPublished: true }),
    })
      .sort({ order: 1 })
      .lean();

    const lessonsByModule = new Map<string, typeof lessons>();
    for (const l of lessons) {
      const key = l.moduleId.toString();
      lessonsByModule.set(key, [...(lessonsByModule.get(key) ?? []), l]);
    }

    const result = modules.map((m) => ({
      ...m,
      lessons: lessonsByModule.get(m._id.toString()) ?? [],
    }));

    ApiResponse.success(res, result, 'Modules');
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, id } = req.params;
    await assertCourseAccess(
      user.tenantId,
      courseId,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );

    const module = await Module.findOneAndUpdate(
      { _id: id, courseId, tenantId: user.tenantId },
      { $set: req.body },
      { new: true },
    ).lean();
    if (!module) throw ApiError.notFound('Module not found');
    ApiResponse.success(res, module, 'Module updated');
  }),

  delete: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, id } = req.params;
    await assertCourseAccess(
      user.tenantId,
      courseId,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );

    const publishedCount = await Lesson.countDocuments({
      moduleId: id,
      tenantId: user.tenantId,
      isPublished: true,
    });
    if (publishedCount > 0) {
      throw ApiError.badRequest('Unpublish all lessons before deleting this module');
    }

    await Lesson.deleteMany({ moduleId: id, tenantId: user.tenantId });
    await Module.deleteOne({ _id: id, tenantId: user.tenantId });
    ApiResponse.noContent(res);
  }),

  reorder: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId } = req.params;
    const { orderedIds } = req.body as { orderedIds: string[] };

    await assertCourseAccess(
      user.tenantId,
      courseId,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );

    // Validate all IDs belong to this course + tenant
    const found = await Module.find({
      _id: { $in: orderedIds.map((id) => new Types.ObjectId(id)) },
      courseId,
      tenantId: user.tenantId,
    })
      .select('_id')
      .lean();

    if (found.length !== orderedIds.length) {
      throw ApiError.badRequest('One or more module IDs are invalid');
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Module.updateOne({ _id: id, courseId, tenantId: user.tenantId }, { order: index }),
      ),
    );

    const modules = await Module.find({ courseId, tenantId: user.tenantId }).sort({ order: 1 }).lean();
    ApiResponse.success(res, modules, 'Modules reordered');
  }),

  publish: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { courseId, id } = req.params;
    await assertCourseAccess(
      user.tenantId,
      courseId,
      user.id,
      user.role === 'admin' || user.role === 'superadmin',
    );

    const module = await Module.findOneAndUpdate(
      { _id: id, courseId, tenantId: user.tenantId },
      [{ $set: { isPublished: { $not: '$isPublished' } } }],
      { new: true },
    ).lean();
    if (!module) throw ApiError.notFound('Module not found');
    ApiResponse.success(res, module, 'Module publish status toggled');
  }),
};
