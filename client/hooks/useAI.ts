'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, PaginatedResponse, PaginationMeta } from '@/types';

/* ───────────────────────── Types ───────────────────────── */

export type AIProviderName = 'openai' | 'anthropic' | 'local';

export interface AIStatus {
  active: AIProviderName;
  configured: Record<AIProviderName, boolean>;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface TutorReply {
  conversationId: string;
  reply: string;
  provider: AIProviderName;
  model: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  courseId: string | null;
  lessonId: string | null;
  lastProvider: AIProviderName | null;
  messageCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  courseId: string | null;
  lessonId: string | null;
  lastProvider: AIProviderName | null;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface RecommendedCourse {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category: string;
  level: string;
  price: number;
  salePrice?: number;
  rating: { average: number; count: number };
  enrolledCount: number;
}

export interface Recommendations {
  basedOn: string[];
  reason: string;
  courses: RecommendedCourse[];
}

export interface TutorRequest {
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
}

/* ───────────────────────── Queries ───────────────────────── */

export function useAIStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: async (): Promise<AIStatus> =>
      (await apiClient.get<ApiResponse<AIStatus>>('/ai/status')).data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAIRecommendations() {
  return useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async (): Promise<Recommendations> =>
      (await apiClient.get<ApiResponse<Recommendations>>('/ai/recommendations')).data.data,
  });
}

export function useConversations(page: number) {
  return useQuery({
    queryKey: ['ai-conversations', page],
    queryFn: async (): Promise<{ items: ConversationSummary[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<ConversationSummary>>(
        `/ai/conversations?page=${page}&limit=20`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['ai-conversation', id],
    queryFn: async (): Promise<ConversationDetail> =>
      (await apiClient.get<ApiResponse<ConversationDetail>>(`/ai/conversations/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

/* ───────────────────────── Mutations ───────────────────────── */

export function useTutorChat() {
  const qc = useQueryClient();
  return useMutation<TutorReply, ApiErrorShape, TutorRequest>({
    mutationFn: async (body) =>
      (await apiClient.post<ApiResponse<TutorReply>>('/ai/tutor', body)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/ai/conversations/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
  });
}

export interface LessonSummary {
  lessonId: string;
  title: string;
  summary: string;
  provider: AIProviderName;
}

export function useSummarizeLesson() {
  return useMutation<LessonSummary, ApiErrorShape, string>({
    mutationFn: async (lessonId) =>
      (await apiClient.post<ApiResponse<LessonSummary>>('/ai/summarize', { lessonId })).data.data,
  });
}

export interface QuizExplanation {
  questionIndex: number;
  correctAnswer: number[];
  explanation: string;
  provider: AIProviderName;
}

export function useQuizExplain() {
  return useMutation<
    QuizExplanation,
    ApiErrorShape,
    { lessonId: string; questionIndex: number; selectedAnswer?: number }
  >({
    mutationFn: async (body) =>
      (await apiClient.post<ApiResponse<QuizExplanation>>('/ai/quiz-explain', body)).data.data,
  });
}

export interface AssignmentFeedback {
  submissionId: string;
  feedback: string;
  provider: AIProviderName;
}

export function useAssignmentFeedback() {
  return useMutation<AssignmentFeedback, ApiErrorShape, string>({
    mutationFn: async (submissionId) =>
      (await apiClient.post<ApiResponse<AssignmentFeedback>>('/ai/assignment-feedback', {
        submissionId,
      })).data.data,
  });
}
