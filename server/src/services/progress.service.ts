import { Types } from 'mongoose';
import { Progress } from '../models/Progress.model';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { ApiError } from '../utils/ApiError';
import { MarkProgressInput } from '../validations/progress.validation';

export const ProgressService = {
  /**
   * Records watch progress for a lesson and recomputes the enrollment's overall
   * completion. Requires the user to be enrolled in the course.
   */
  async mark(tenantId: string, userId: string, input: MarkProgressInput) {
    const enrollment = await Enrollment.findOne({ tenantId, userId, courseId: input.courseId });
    if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course');

    const progress = await Progress.findOneAndUpdate(
      { tenantId, userId, lessonId: input.lessonId },
      {
        $set: {
          courseId: new Types.ObjectId(input.courseId),
          ...(input.watchedSeconds !== undefined ? { watchedSeconds: input.watchedSeconds } : {}),
          ...(input.isCompleted !== undefined ? { isCompleted: input.isCompleted } : {}),
          ...(input.isCompleted ? { completedAt: new Date() } : {}),
        },
        $setOnInsert: {
          tenantId: new Types.ObjectId(tenantId),
          userId: new Types.ObjectId(userId),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    enrollment.progress.lastLesson = new Types.ObjectId(input.lessonId);
    if (input.isCompleted) {
      const already = enrollment.progress.completedLessons.some(
        (id) => id.toString() === input.lessonId,
      );
      if (!already) enrollment.progress.completedLessons.push(new Types.ObjectId(input.lessonId));
    }

    const course = await Course.findById(input.courseId).select('totalLessons').lean();
    const total = course?.totalLessons ?? 0;
    enrollment.progress.percentage =
      total > 0 ? Math.round((enrollment.progress.completedLessons.length / total) * 100) : 0;
    await enrollment.save();

    return { progress: progress.toObject(), enrollmentProgress: enrollment.progress };
  },

  /** All progress records for a user within a course. */
  async getByCourse(tenantId: string, userId: string, courseId: string) {
    return Progress.find({ tenantId, userId, courseId }).lean();
  },
};
