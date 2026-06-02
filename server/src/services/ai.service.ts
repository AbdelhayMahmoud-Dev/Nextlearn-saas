import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Lesson } from '../models/Lesson.model';
import { Quiz } from '../models/Quiz.model';
import { Assignment } from '../models/Assignment.model';
import { Submission } from '../models/Submission.model';
import { Enrollment } from '../models/Enrollment.model';
import { AIConversation, IAIConversation } from '../models/AIConversation.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { getAIProvider, getAIStatus } from './ai/ai.provider';
import { ChatMessage } from './ai/ai.types';
import { stripHtml } from './ai/extractive';
import type { UserRole } from '../models/User.model';

/** Conversation history is bounded to keep prompts (and storage) reasonable. */
const MAX_HISTORY_MESSAGES = 20;

const TUTOR_SYSTEM_PREFIX =
  'You are NextLearn, a concise and encouraging learning assistant. Answer the ' +
  "student's question using the course material provided below. If the material " +
  'does not cover it, say so briefly and suggest what to review.\n\nCOURSE MATERIAL:\n';

function oid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Builds grounding context from an optional course + lesson, scoped to tenant. */
async function buildContext(
  tenantId: string,
  courseId?: string,
  lessonId?: string,
): Promise<string> {
  const parts: string[] = [];

  if (lessonId) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId }).lean();
    if (lesson) {
      parts.push(`Lesson: ${lesson.title}`);
      if (lesson.content.article) parts.push(stripHtml(lesson.content.article));
    }
  }

  if (courseId) {
    const course = await Course.findOne({ _id: courseId, tenantId }).lean();
    if (course) {
      parts.unshift(
        `Course: ${course.title}. ${course.description}`,
        course.outcomes.length ? `Learning outcomes: ${course.outcomes.join('; ')}.` : '',
      );
    }
  }

  return parts.filter(Boolean).join('\n\n');
}

function toChatMessages(conversation: IAIConversation): ChatMessage[] {
  return conversation.messages.map((m) => ({ role: m.role, content: m.content }));
}

export const AIService = {
  /** Active provider + which hosted providers are configured. */
  status() {
    return getAIStatus();
  },

  /**
   * Sends a tutor message: grounds on course/lesson context, calls the active
   * provider, persists the exchange, and returns the assistant reply.
   */
  async tutorChat(args: {
    tenantId: string;
    userId: string;
    conversationId?: string;
    courseId?: string;
    lessonId?: string;
    message: string;
  }) {
    const { tenantId, userId, message } = args;

    let conversation: IAIConversation | null = null;
    if (args.conversationId) {
      conversation = await AIConversation.findOne({ _id: args.conversationId, tenantId, userId });
      if (!conversation) throw ApiError.notFound('Conversation not found');
    }

    const courseId = args.courseId ?? conversation?.courseId?.toString();
    const lessonId = args.lessonId ?? conversation?.lessonId?.toString();
    const context = await buildContext(tenantId, courseId, lessonId);

    if (!conversation) {
      conversation = new AIConversation({
        tenantId: oid(tenantId),
        userId: oid(userId),
        courseId: courseId ? oid(courseId) : undefined,
        lessonId: lessonId ? oid(lessonId) : undefined,
        title: message.slice(0, 80),
        messages: [],
      });
    }

    const history = toChatMessages(conversation).slice(-MAX_HISTORY_MESSAGES);
    const provider = getAIProvider();
    const result = await provider.complete({
      system: context ? TUTOR_SYSTEM_PREFIX + context : undefined,
      messages: [...history, { role: 'user', content: message }],
    });

    const now = new Date();
    conversation.messages.push({ role: 'user', content: message, createdAt: now });
    conversation.messages.push({ role: 'assistant', content: result.text, createdAt: new Date() });
    if (conversation.messages.length > MAX_HISTORY_MESSAGES * 2) {
      conversation.messages = conversation.messages.slice(-MAX_HISTORY_MESSAGES * 2);
    }
    conversation.lastProvider = result.provider;
    await conversation.save();

    return {
      conversationId: conversation._id.toString(),
      reply: result.text,
      provider: result.provider,
      model: result.model,
    };
  },

  /** Summarizes a lesson's article content into a short study recap. */
  async summarizeLesson(tenantId: string, lessonId: string) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId }).lean();
    if (!lesson) throw ApiError.notFound('Lesson not found');
    const material = stripHtml(lesson.content.article ?? '');
    if (!material) throw ApiError.badRequest('This lesson has no text content to summarize');

    const provider = getAIProvider();
    const result = await provider.complete({
      system: TUTOR_SYSTEM_PREFIX + `Lesson: ${lesson.title}\n\n${material}`,
      messages: [{ role: 'user', content: 'Summarize the key points of this lesson.' }],
      temperature: 0.2,
    });
    return { lessonId, title: lesson.title, summary: result.text, provider: result.provider };
  },

  /** Explains a quiz question (why the correct answer is correct). */
  async explainQuizQuestion(args: {
    tenantId: string;
    lessonId: string;
    questionIndex: number;
    selectedAnswer?: number;
  }) {
    const { tenantId, lessonId, questionIndex } = args;
    const quiz = await Quiz.findOne({ lessonId, tenantId }).lean();
    if (!quiz) throw ApiError.notFound('Quiz not found');
    const question = quiz.questions[questionIndex];
    if (!question) throw ApiError.badRequest('Invalid question index');

    const correctText = question.correctAnswer
      .map((i) => question.options[i])
      .filter(Boolean)
      .join(', ');
    const contextLines = [
      `Question: ${question.text}`,
      `Options: ${question.options.join(' | ')}`,
      `Correct answer: ${correctText}`,
      question.explanation ? `Reference explanation: ${question.explanation}` : '',
    ].filter(Boolean);

    const provider = getAIProvider();
    const result = await provider.complete({
      system: TUTOR_SYSTEM_PREFIX + contextLines.join('\n'),
      messages: [
        {
          role: 'user',
          content: 'Explain why the correct answer is correct, in two or three sentences.',
        },
      ],
      temperature: 0.3,
    });

    return {
      questionIndex,
      correctAnswer: question.correctAnswer,
      explanation: result.text,
      provider: result.provider,
    };
  },

  /**
   * Generates rubric-aware feedback for a submission. Students may request it
   * for their own work; instructors/admins for any submission in the tenant.
   */
  async assignmentFeedback(args: {
    tenantId: string;
    userId: string;
    role: UserRole;
    submissionId: string;
  }) {
    const { tenantId, userId, role, submissionId } = args;
    const submission = await Submission.findOne({ _id: submissionId, tenantId }).lean();
    if (!submission) throw ApiError.notFound('Submission not found');

    const isOwner = submission.userId.toString() === userId;
    const isStaff = role === 'instructor' || role === 'admin' || role === 'superadmin';
    if (!isOwner && !isStaff) throw ApiError.forbidden('Not allowed to access this submission');

    const assignment = await Assignment.findOne({ _id: submission.assignmentId, tenantId }).lean();
    if (!assignment) throw ApiError.notFound('Assignment not found');

    const rubric = assignment.rubric
      .map((r) => `- ${r.criterion} (max ${r.maxPoints} pts)`)
      .join('\n');
    const context = [
      `Assignment: ${assignment.title}`,
      `Instructions: ${stripHtml(assignment.description)}`,
      rubric ? `Rubric:\n${rubric}` : '',
      `\nStudent submission:\n${stripHtml(submission.content)}`,
    ]
      .filter(Boolean)
      .join('\n');

    const provider = getAIProvider();
    const result = await provider.complete({
      system:
        'You are a supportive teaching assistant. Give specific, actionable feedback on the ' +
        'submission against the rubric. Note strengths first, then concrete improvements.\n\n' +
        context,
      messages: [{ role: 'user', content: 'Provide feedback on this submission.' }],
      temperature: 0.4,
    });

    return { submissionId, feedback: result.text, provider: result.provider };
  },

  /**
   * Content-based course recommendations from the learner's enrollment history
   * (same categories, highest rated), backfilled with top courses. Deterministic
   * — no external API required.
   */
  async recommendations(tenantId: string, userId: string, limit = 6) {
    const enrollments = await Enrollment.find({ tenantId, userId }).select('courseId').lean();
    const enrolledIds = enrollments.map((e) => e.courseId);

    const enrolledCourses = enrolledIds.length
      ? await Course.find({ _id: { $in: enrolledIds } })
          .select('category tags')
          .lean()
      : [];
    const categories = [...new Set(enrolledCourses.map((c) => c.category))];

    const baseFilter = {
      tenantId: oid(tenantId),
      isPublished: true,
      isApproved: true,
      _id: { $nin: enrolledIds },
    };
    const projection = 'title slug thumbnail category level price salePrice rating enrolledCount';

    const primary = categories.length
      ? await Course.find({ ...baseFilter, category: { $in: categories } })
          .select(projection)
          .sort({ 'rating.average': -1, enrolledCount: -1 })
          .limit(limit)
          .lean()
      : [];

    let results = primary;
    if (results.length < limit) {
      const excludeIds = [...enrolledIds, ...primary.map((c) => c._id)];
      const backfill = await Course.find({
        tenantId: oid(tenantId),
        isPublished: true,
        isApproved: true,
        _id: { $nin: excludeIds },
      })
        .select(projection)
        .sort({ 'rating.average': -1, enrolledCount: -1 })
        .limit(limit - results.length)
        .lean();
      results = [...primary, ...backfill];
    }

    return {
      basedOn: categories,
      reason: categories.length
        ? 'Based on the topics you are learning'
        : 'Popular courses to get you started',
      courses: results,
    };
  },

  /** Paginated list of the user's conversations (no message bodies). */
  async listConversations(
    tenantId: string,
    userId: string,
    query: { page?: unknown; limit?: unknown },
  ) {
    const { page, limit, skip } = getPagination(query, 20);
    const filter = { tenantId, userId };
    const [docs, total] = await Promise.all([
      AIConversation.find(filter)
        .select('title courseId lessonId lastProvider updatedAt messages')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIConversation.countDocuments(filter),
    ]);

    const items = docs.map((d) => ({
      id: d._id.toString(),
      title: d.title,
      courseId: d.courseId?.toString() ?? null,
      lessonId: d.lessonId?.toString() ?? null,
      lastProvider: d.lastProvider ?? null,
      messageCount: d.messages.length,
      updatedAt: d.updatedAt,
    }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Full conversation thread (owned by the requesting user). */
  async getConversation(tenantId: string, userId: string, id: string) {
    const conversation = await AIConversation.findOne({ _id: id, tenantId, userId }).lean();
    if (!conversation) throw ApiError.notFound('Conversation not found');
    return {
      id: conversation._id.toString(),
      title: conversation.title,
      courseId: conversation.courseId?.toString() ?? null,
      lessonId: conversation.lessonId?.toString() ?? null,
      lastProvider: conversation.lastProvider ?? null,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  },

  /** Deletes a conversation owned by the user. */
  async deleteConversation(tenantId: string, userId: string, id: string): Promise<void> {
    const result = await AIConversation.deleteOne({ _id: id, tenantId, userId });
    if (result.deletedCount === 0) throw ApiError.notFound('Conversation not found');
  },
};
