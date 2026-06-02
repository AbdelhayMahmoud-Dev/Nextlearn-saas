import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { ApiError } from '../utils/ApiError';
import { Assignment } from '../models/Assignment.model';
import { Submission } from '../models/Submission.model';
import { Enrollment } from '../models/Enrollment.model';
import { Lesson } from '../models/Lesson.model';
import { User } from '../models/User.model';
import { NotificationService } from '../services/notification.service';

type UserLean = { _id: { toString(): string }; name: string; email: string; avatar?: string };

export const AssignmentController = {
  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const assignment = await Assignment.create({ tenantId: user.tenantId, ...req.body });
    ApiResponse.created(res, assignment.toObject(), 'Assignment created');
  }),

  get: asyncHandler(async (req, res) => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');
    const assignment = await Assignment.findOne({ _id: req.params.id, tenantId }).lean();
    if (!assignment) throw ApiError.notFound('Assignment not found');
    ApiResponse.success(res, assignment, 'Assignment');
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, tenantId: user.tenantId },
      { $set: req.body },
      { new: true },
    ).lean();
    if (!assignment) throw ApiError.notFound('Assignment not found');
    ApiResponse.success(res, assignment, 'Assignment updated');
  }),

  delete: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await Assignment.deleteOne({ _id: req.params.id, tenantId: user.tenantId });
    ApiResponse.noContent(res);
  }),

  submit: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      tenantId: user.tenantId,
    }).lean();
    if (!assignment) throw ApiError.notFound('Assignment not found');

    // Verify enrollment
    const lesson = await Lesson.findOne({ _id: assignment.lessonId }).select('courseId').lean();
    if (lesson) {
      const enrolled = await Enrollment.exists({
        tenantId: user.tenantId,
        userId: user.id,
        courseId: lesson.courseId,
        status: 'active',
      });
      if (!enrolled) throw ApiError.forbidden('You must be enrolled to submit this assignment');
    }

    const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;

    // Upsert: one submission per student per assignment
    const existing = await Submission.findOne({
      assignmentId: assignment._id,
      userId: user.id,
      tenantId: user.tenantId,
    });

    let submission;
    if (existing) {
      existing.content = req.body.content ?? '';
      existing.attachments = req.body.attachments ?? existing.attachments;
      existing.status = 'pending';
      existing.isLate = isLate;
      existing.submissionCount += 1;
      existing.submittedAt = new Date();
      await existing.save();
      submission = existing.toObject();
    } else {
      const created = await Submission.create({
        tenantId: user.tenantId,
        assignmentId: assignment._id,
        userId: user.id,
        content: req.body.content ?? '',
        attachments: req.body.attachments ?? [],
        isLate,
        submissionCount: 1,
      });
      submission = created.toObject();
    }

    ApiResponse.created(res, submission, 'Assignment submitted');
  }),

  listSubmissions: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const submissions = await Submission.find({
      assignmentId: req.params.id,
      tenantId: user.tenantId,
    })
      .sort({ submittedAt: -1 })
      .lean();

    // Attach student info
    const studentIds = [...new Set(submissions.map((s) => s.userId.toString()))];
    const students = await User.find({ _id: { $in: studentIds } })
      .select('name email avatar')
      .lean<UserLean[]>();
    const byId = new Map(students.map((s) => [s._id.toString(), s]));

    const result = submissions.map((s) => ({
      ...s,
      student: byId.get(s.userId.toString()),
    }));

    ApiResponse.success(res, result, 'Submissions');
  }),

  getMySubmission: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const submission = await Submission.findOne({
      assignmentId: req.params.id,
      userId: user.id,
      tenantId: user.tenantId,
    }).lean();
    ApiResponse.success(res, submission ?? null, 'My submission');
  }),

  grade: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { score, feedback } = req.body as { score: number; feedback?: string };

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      tenantId: user.tenantId,
    }).lean();
    if (!assignment) throw ApiError.notFound('Assignment not found');

    if (score < 0 || score > assignment.maxScore) {
      throw ApiError.badRequest(`Score must be between 0 and ${assignment.maxScore}`);
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.subId, assignmentId: assignment._id, tenantId: user.tenantId },
      { $set: { score, feedback: feedback ?? '', status: 'graded' } },
      { new: true },
    ).lean();
    if (!submission) throw ApiError.notFound('Submission not found');

    // Notify student (real-time push via NotificationService)
    await NotificationService.create(user.tenantId, submission.userId.toString(), {
      type: 'assignment_graded',
      title: 'Assignment graded',
      body: `Your submission for "${assignment.title}" has been reviewed. Score: ${score}/${assignment.maxScore}`,
    });

    ApiResponse.success(res, submission, 'Submission graded');
  }),
};
