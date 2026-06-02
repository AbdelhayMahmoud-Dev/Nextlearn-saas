import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Module } from '../models/Module.model';
import { Lesson } from '../models/Lesson.model';
import { Enrollment } from '../models/Enrollment.model';
import { ApiError } from '../utils/ApiError';

export const LearnService = {
  /**
   * Returns everything the course player's sidebar needs: course header,
   * modules → lessons (no video payloads), enrollment flag, and progress.
   */
  async getCourseLearn(tenantId: string, userId: string, courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) throw ApiError.notFound('Course not found');

    const course = await Course.findOne({ tenantId, _id: courseId, isPublished: true })
      .select('title slug totalLessons totalDuration')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');

    const [enrollment, modules] = await Promise.all([
      Enrollment.findOne({ tenantId, userId, courseId }).lean(),
      Module.find({ courseId, isPublished: true }).sort({ order: 1 }).lean(),
    ]);

    const lessons = await Lesson.find({
      moduleId: { $in: modules.map((m) => m._id) },
      isPublished: true,
    })
      .sort({ order: 1 })
      .select('title type order isFree moduleId content.duration')
      .lean();

    const byModule = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const key = lesson.moduleId.toString();
      const list = byModule.get(key) ?? [];
      list.push(lesson);
      byModule.set(key, list);
    }

    return {
      course,
      isEnrolled: Boolean(enrollment),
      progress: enrollment?.progress ?? { completedLessons: [], percentage: 0 },
      modules: modules.map((m) => ({ ...m, lessons: byModule.get(m._id.toString()) ?? [] })),
    };
  },

  /**
   * Returns a single lesson with full content, enforcing access: free lessons
   * are open; otherwise the user must be enrolled in the course.
   */
  async getLesson(tenantId: string, userId: string, courseId: string, lessonId: string) {
    if (!Types.ObjectId.isValid(lessonId)) throw ApiError.notFound('Lesson not found');

    const lesson = await Lesson.findOne({ tenantId, _id: lessonId, courseId, isPublished: true }).lean();
    if (!lesson) throw ApiError.notFound('Lesson not found');

    if (!lesson.isFree) {
      const enrolled = await Enrollment.exists({ tenantId, userId, courseId });
      if (!enrolled) throw ApiError.forbidden('Enroll in this course to access this lesson');
    }
    return lesson;
  },
};
