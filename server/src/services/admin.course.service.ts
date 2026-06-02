import { FilterQuery, Types } from 'mongoose';
import { Course, ICourse } from '../models/Course.model';
import { Module } from '../models/Module.model';
import { Lesson } from '../models/Lesson.model';
import { Enrollment } from '../models/Enrollment.model';
import { Review } from '../models/Review.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { NotificationService } from './notification.service';

type InstructorLite = { _id: Types.ObjectId; name: string; avatar?: string };

interface ListFilters {
  page?: unknown;
  limit?: unknown;
  status?: string;
  category?: string;
  search?: string;
  instructorId?: string;
}

export const AdminCourseService = {
  /** Paginated course list with instructor info (admin sees all statuses). */
  async listAllCourses(tenantId: string, filters: ListFilters) {
    const { page, limit, skip } = getPagination(filters, 100);
    const query: FilterQuery<ICourse> = { tenantId };
    if (filters.status === 'published') query.isPublished = true;
    if (filters.status === 'draft') query.isPublished = false;
    if (filters.status === 'pending') query.isApproved = false;
    if (filters.category) query.category = filters.category;
    if (filters.instructorId) query.instructorId = new Types.ObjectId(filters.instructorId);
    if (filters.search) {
      const rx = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.title = rx;
    }

    const [courses, total] = await Promise.all([
      Course.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Course.countDocuments(query),
    ]);

    const instructorIds = [...new Set(courses.map((c) => c.instructorId.toString()))];
    const instructors = await User.find({ _id: { $in: instructorIds } })
      .select('name avatar')
      .lean<InstructorLite[]>();
    const byId = new Map(instructors.map((u) => [u._id.toString(), u]));

    const items = courses.map((c) => ({ ...c, instructor: byId.get(c.instructorId.toString()) ?? null }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Full course detail (modules + lessons + instructor) — admin bypasses ownership. */
  async getCourse(tenantId: string, courseId: string) {
    const course = await Course.findOne({ _id: courseId, tenantId }).lean();
    if (!course) throw ApiError.notFound('Course not found');

    const [instructor, modules] = await Promise.all([
      User.findById(course.instructorId).select('name email avatar bio').lean(),
      Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
    ]);
    const lessons = await Lesson.find({ moduleId: { $in: modules.map((m) => m._id) } })
      .sort({ order: 1 })
      .lean();
    const lessonsByModule = new Map<string, typeof lessons>();
    for (const l of lessons) {
      const key = l.moduleId.toString();
      lessonsByModule.set(key, [...(lessonsByModule.get(key) ?? []), l]);
    }

    return {
      ...course,
      instructor: instructor ?? null,
      modules: modules.map((m) => ({ ...m, lessons: lessonsByModule.get(m._id.toString()) ?? [] })),
    };
  },

  /** Approves a course (clears any rejection reason) and notifies the instructor. */
  async approveCourse(tenantId: string, courseId: string) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, tenantId },
      { $set: { isApproved: true }, $unset: { rejectionReason: '' } },
      { new: true },
    ).lean();
    if (!course) throw ApiError.notFound('Course not found');
    await NotificationService.create(tenantId, course.instructorId.toString(), {
      type: 'course',
      title: 'Course approved',
      body: `Your course “${course.title}” has been approved.`,
      link: `/instructor/courses/${course._id}/edit`,
    });
    return course;
  },

  /** Rejects a course with a reason and notifies the instructor. */
  async rejectCourse(tenantId: string, courseId: string, reason: string) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, tenantId },
      { $set: { isApproved: false, rejectionReason: reason } },
      { new: true },
    ).lean();
    if (!course) throw ApiError.notFound('Course not found');
    await NotificationService.create(tenantId, course.instructorId.toString(), {
      type: 'course',
      title: 'Course needs changes',
      body: `Your course “${course.title}” was rejected: ${reason}`,
      link: `/instructor/courses/${course._id}/edit`,
    });
    return course;
  },

  /** Hard-deletes a course and cascades modules, lessons, enrollments, reviews. */
  async deleteCourse(tenantId: string, courseId: string): Promise<void> {
    const course = await Course.findOne({ _id: courseId, tenantId }).select('_id title').lean();
    if (!course) throw ApiError.notFound('Course not found');

    await Promise.all([
      Module.deleteMany({ courseId: course._id }),
      Lesson.deleteMany({ courseId: course._id }),
      Enrollment.deleteMany({ courseId: course._id }),
      Review.deleteMany({ courseId: course._id }),
    ]);
    await Course.deleteOne({ _id: course._id });

    // Audit trail (no dedicated AuditLog model yet → structured log).
    logger.warn({ action: 'admin.course.delete', tenantId, courseId, title: course.title }, 'Admin hard-deleted a course');
  },
};
