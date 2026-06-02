import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const tutorChatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, 'Message is required').max(4000),
    conversationId: objectId.optional(),
    courseId: objectId.optional(),
    lessonId: objectId.optional(),
  }),
});

export const summarizeSchema = z.object({
  body: z.object({
    lessonId: objectId,
  }),
});

export const quizExplainSchema = z.object({
  body: z.object({
    lessonId: objectId,
    questionIndex: z.coerce.number().int().min(0),
    selectedAnswer: z.coerce.number().int().min(0).optional(),
  }),
});

export const assignmentFeedbackSchema = z.object({
  body: z.object({
    submissionId: objectId,
  }),
});

export type TutorChatInput = z.infer<typeof tutorChatSchema>['body'];
export type SummarizeInput = z.infer<typeof summarizeSchema>['body'];
export type QuizExplainInput = z.infer<typeof quizExplainSchema>['body'];
export type AssignmentFeedbackInput = z.infer<typeof assignmentFeedbackSchema>['body'];
