import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { AIService } from '../services/ai.service';
import type {
  TutorChatInput,
  SummarizeInput,
  QuizExplainInput,
  AssignmentFeedbackInput,
} from '../validations/ai.validation';

export const AIController = {
  status: asyncHandler(async (_req, res) => {
    ApiResponse.success(res, AIService.status(), 'AI status');
  }),

  tutor: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const body = req.body as TutorChatInput;
    const result = await AIService.tutorChat({
      tenantId: user.tenantId,
      userId: user.id,
      message: body.message,
      conversationId: body.conversationId,
      courseId: body.courseId,
      lessonId: body.lessonId,
    });
    ApiResponse.success(res, result, 'Assistant reply');
  }),

  summarize: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const body = req.body as SummarizeInput;
    const result = await AIService.summarizeLesson(user.tenantId, body.lessonId);
    ApiResponse.success(res, result, 'Lesson summary');
  }),

  quizExplain: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const body = req.body as QuizExplainInput;
    const result = await AIService.explainQuizQuestion({
      tenantId: user.tenantId,
      lessonId: body.lessonId,
      questionIndex: body.questionIndex,
      selectedAnswer: body.selectedAnswer,
    });
    ApiResponse.success(res, result, 'Quiz explanation');
  }),

  assignmentFeedback: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const body = req.body as AssignmentFeedbackInput;
    const result = await AIService.assignmentFeedback({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      submissionId: body.submissionId,
    });
    ApiResponse.success(res, result, 'Assignment feedback');
  }),

  recommendations: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await AIService.recommendations(user.tenantId, user.id);
    ApiResponse.success(res, result, 'Recommended courses');
  }),

  listConversations: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await AIService.listConversations(user.tenantId, user.id, req.query);
    ApiResponse.success(res, items, 'Conversations', 200, meta);
  }),

  getConversation: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const result = await AIService.getConversation(user.tenantId, user.id, req.params.id);
    ApiResponse.success(res, result, 'Conversation');
  }),

  deleteConversation: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await AIService.deleteConversation(user.tenantId, user.id, req.params.id);
    ApiResponse.noContent(res);
  }),
};
