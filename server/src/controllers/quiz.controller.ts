import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { ApiError } from '../utils/ApiError';
import { Quiz } from '../models/Quiz.model';
import { QuizAttempt } from '../models/QuizAttempt.model';
import { Enrollment } from '../models/Enrollment.model';
import { Subscription } from '../models/Subscription.model';
import { Lesson } from '../models/Lesson.model';
import { Progress } from '../models/Progress.model';

/** Check enrollment or subscription for content access. */
async function verifyStudentAccess(
  tenantId: string,
  userId: string,
  courseId: string,
): Promise<void> {
  const [enrolled, subscribed] = await Promise.all([
    Enrollment.exists({ tenantId, userId, courseId, status: 'active' }),
    Subscription.exists({ tenantId, userId, status: 'active' }),
  ]);
  if (!enrolled && !subscribed) {
    throw ApiError.forbidden('You must be enrolled to take this quiz');
  }
}

export const QuizController = {
  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const quiz = await Quiz.create({ tenantId: user.tenantId, ...req.body });
    ApiResponse.created(res, quiz.toObject(), 'Quiz created');
  }),

  get: asyncHandler(async (req, res) => {
    const user = req.user;
    const tenantId = req.tenantId ?? user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');

    const quiz = await Quiz.findOne({ _id: req.params.id, tenantId }).lean();
    if (!quiz) throw ApiError.notFound('Quiz not found');

    const isInstructor =
      user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      user?.role === 'instructor';

    // Students don't see correct answers on the quiz fetch
    if (!isInstructor) {
      const publicQuestions = quiz.questions.map(({ text, type, options, points }) => ({
        text, type, options, points,
      }));
      return ApiResponse.success(res, { ...quiz, questions: publicQuestions }, 'Quiz');
    }

    return ApiResponse.success(res, quiz, 'Quiz');
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, tenantId: user.tenantId },
      { $set: req.body },
      { new: true },
    ).lean();
    if (!quiz) throw ApiError.notFound('Quiz not found');
    ApiResponse.success(res, quiz, 'Quiz updated');
  }),

  delete: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await Quiz.deleteOne({ _id: req.params.id, tenantId: user.tenantId });
    ApiResponse.noContent(res);
  }),

  submitAttempt: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const quiz = await Quiz.findOne({ _id: req.params.id, tenantId: user.tenantId }).lean();
    if (!quiz) throw ApiError.notFound('Quiz not found');

    // Resolve courseId from lesson
    const lesson = await Lesson.findOne({ _id: quiz.lessonId, tenantId: user.tenantId })
      .select('courseId')
      .lean();
    if (!lesson) throw ApiError.notFound('Associated lesson not found');

    await verifyStudentAccess(user.tenantId, user.id, lesson.courseId.toString());

    const { answers } = req.body as {
      answers: { questionIndex: number; selected: number[] }[];
    };

    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = quiz.questions.map((question, qi) => {
      const submitted = answers.find((a) => a.questionIndex === qi);
      const selected = submitted?.selected ?? [];
      const correct = question.correctAnswer;
      totalPoints += question.points;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'single' || question.type === 'boolean') {
        isCorrect = selected.length === 1 && selected[0] === correct[0];
        if (isCorrect) pointsEarned = question.points;
      } else {
        // multi-select: all correct options selected + no wrong options = full points
        const selectedSet = new Set(selected);
        const correctSet = new Set(correct);
        const allCorrectSelected = correct.every((c) => selectedSet.has(c));
        const noWrongSelected = selected.every((s) => correctSet.has(s));
        if (allCorrectSelected && noWrongSelected) {
          isCorrect = true;
          pointsEarned = question.points;
        } else if (allCorrectSelected || (noWrongSelected && selected.length > 0)) {
          // Partial credit
          const partialRatio = selected.filter((s) => correctSet.has(s)).length / correct.length;
          pointsEarned = Math.floor(question.points * partialRatio);
        }
      }

      earnedPoints += pointsEarned;
      return {
        questionIndex: qi,
        selected,
        isCorrect,
        correctAnswer: correct,
        explanation: question.explanation,
      };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      tenantId: user.tenantId,
      userId: user.id,
      quizId: quiz._id,
      answers: answers,
      score,
      passed,
      attemptedAt: new Date(),
    });

    // Mark lesson complete if first pass
    if (passed) {
      const previousPasses = await QuizAttempt.countDocuments({
        quizId: quiz._id,
        userId: user.id,
        passed: true,
        _id: { $ne: attempt._id },
      });
      if (previousPasses === 0) {
        await Progress.findOneAndUpdate(
          { tenantId: user.tenantId, userId: user.id, lessonId: quiz.lessonId },
          { $set: { isCompleted: true, completedAt: new Date() } },
          { upsert: true },
        );
      }
    }

    ApiResponse.success(
      res,
      {
        attemptId: attempt._id,
        score,
        passed,
        totalPoints,
        earnedPoints,
        answers: gradedAnswers,
      },
      passed ? 'Quiz passed!' : 'Quiz submitted',
    );
  }),

  getMyAttempts: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const attempts = await QuizAttempt.find({
      quizId: req.params.id,
      userId: user.id,
      tenantId: user.tenantId,
    })
      .sort({ attemptedAt: -1 })
      .lean();
    ApiResponse.success(res, attempts, 'My attempts');
  }),

  getAllAttempts: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const attempts = await QuizAttempt.find({
      quizId: req.params.id,
      tenantId: user.tenantId,
    })
      .sort({ attemptedAt: -1 })
      .lean();
    ApiResponse.success(res, attempts, 'All attempts');
  }),
};
