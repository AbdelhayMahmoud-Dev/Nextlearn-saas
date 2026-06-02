'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, IQuiz } from '@/types';

/** Fetch quiz by lessonId (instructor view — includes correct answers). */
export function useQuizByLesson(lessonId: string) {
  return useQuery({
    queryKey: ['quiz-builder', lessonId],
    enabled: Boolean(lessonId),
    queryFn: async (): Promise<IQuiz | null> => {
      const { data } = await apiClient.get<ApiResponse<IQuiz[]>>('/quizzes', {
        params: { lessonId },
      }).catch(() => ({ data: { data: [] as IQuiz[] } }));
      return data.data?.[0] ?? null;
    },
    staleTime: 30_000,
  });
}

/** Fetch a single quiz by ID. */
export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: ['quiz', quizId],
    enabled: Boolean(quizId),
    queryFn: async (): Promise<IQuiz> => {
      const { data } = await apiClient.get<ApiResponse<IQuiz>>(`/quizzes/${quizId}`);
      return data.data;
    },
    staleTime: 30_000,
  });
}

/** Create a new quiz. */
export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation<IQuiz, ApiErrorShape, Partial<IQuiz>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<IQuiz>>('/quizzes', body);
      return data.data;
    },
    onSuccess: (quiz) => {
      void qc.invalidateQueries({ queryKey: ['quiz-builder', quiz.lessonId] });
    },
  });
}

/** Update quiz settings and questions. */
export function useUpdateQuiz(quizId: string) {
  const qc = useQueryClient();
  return useMutation<IQuiz, ApiErrorShape, Partial<IQuiz>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.put<ApiResponse<IQuiz>>(`/quizzes/${quizId}`, body);
      return data.data;
    },
    onSuccess: (quiz) => {
      void qc.invalidateQueries({ queryKey: ['quiz', quizId] });
      void qc.invalidateQueries({ queryKey: ['quiz-builder', quiz.lessonId] });
    },
  });
}
