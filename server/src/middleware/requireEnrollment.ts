import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { EnrollmentService } from '../services/enrollment.service';
import { Quiz } from '../models/Quiz.model';
import { Assignment } from '../models/Assignment.model';
import { Lesson } from '../models/Lesson.model';

/**
 * Guards content routes: only users with access (active enrollment, active
 * subscription, free lesson, or instructor/admin) may proceed.
 *
 * Resolves `courseId` and (optionally) `lessonId` from route params. Must run
 * after `authenticate`.
 */
export function requireEnrollment(req: Request, _res: Response, next: NextFunction): void {
  void (async (): Promise<void> => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const courseId = req.params.courseId ?? req.params.id;
      if (!courseId) throw ApiError.badRequest('Course context is required');
      const lessonId = req.params.lessonId;

      const { hasAccess } = await EnrollmentService.checkAccess(
        req.user.tenantId,
        req.user.id,
        courseId,
        lessonId,
      );
      if (!hasAccess) {
        throw ApiError.forbidden('Purchase this course to access this content');
      }
      next();
    } catch (err) {
      next(err);
    }
  })();
}

/**
 * Resolves the course that owns a lesson-bound entity (quiz/assignment) and
 * runs the same access check. Used where the route param is the entity id
 * (`/:id`) rather than a `courseId`.
 */
function guardByLesson(
  loadLessonId: (req: Request) => Promise<string | null>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    void (async (): Promise<void> => {
      try {
        if (!req.user) throw ApiError.unauthorized();
        const lessonId = await loadLessonId(req);
        if (!lessonId) throw ApiError.notFound('Resource not found');
        const lesson = await Lesson.findOne({ _id: lessonId, tenantId: req.user.tenantId })
          .select('courseId')
          .lean();
        if (!lesson) throw ApiError.notFound('Lesson not found');

        const { hasAccess } = await EnrollmentService.checkAccess(
          req.user.tenantId,
          req.user.id,
          lesson.courseId.toString(),
          lessonId,
        );
        if (!hasAccess) {
          throw ApiError.forbidden('Purchase this course to access this content');
        }
        next();
      } catch (err) {
        next(err);
      }
    })();
  };
}

/** Enrollment guard for `POST /quizzes/:id/attempts`. */
export const requireEnrollmentForQuiz = guardByLesson(async (req) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, tenantId: req.user?.tenantId })
    .select('lessonId')
    .lean();
  return quiz ? quiz.lessonId.toString() : null;
});

/** Enrollment guard for `POST /assignments/:id/submissions`. */
export const requireEnrollmentForAssignment = guardByLesson(async (req) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, tenantId: req.user?.tenantId })
    .select('lessonId')
    .lean();
  return assignment ? assignment.lessonId.toString() : null;
});
