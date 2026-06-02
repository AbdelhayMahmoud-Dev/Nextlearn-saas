import { z } from 'zod';

const questionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required').max(2000),
  type: z.enum(['single', 'multiple', 'boolean']),
  options: z.array(z.string().trim().min(1)).min(2, 'At least 2 options required').max(6),
  correctAnswer: z.array(z.number().int().min(0)).min(1, 'At least one correct answer required'),
  points: z.number().min(0).default(1),
  explanation: z.string().max(1000).optional(),
});

export const createQuizSchema = z.object({
  body: z.object({
    lessonId: z.string().min(1),
    questions: z.array(questionSchema).default([]),
    passingScore: z.number().min(0).max(100).default(70),
    timeLimit: z.number().int().min(0).default(0),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    allowRetry: z.boolean().default(true),
    maxAttempts: z.number().int().min(1).default(3),
  }),
});

export const updateQuizSchema = z.object({
  body: createQuizSchema.shape.body.partial(),
});

export const submitAttemptSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionIndex: z.number().int().min(0),
        selected: z.array(z.number().int().min(0)),
      }),
    ).min(1),
  }),
});

export type CreateQuizBody = z.infer<typeof createQuizSchema>['body'];
