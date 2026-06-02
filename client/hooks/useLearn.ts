'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, IEnrollmentProgress, ILesson, LessonType } from '@/types';

export interface LearnLesson {
  _id: string;
  title: string;
  type: LessonType;
  order: number;
  isFree: boolean;
  moduleId: string;
  content?: { duration?: number };
}

export interface LearnModule {
  _id: string;
  title: string;
  order: number;
  lessons: LearnLesson[];
}

export interface LearnData {
  course: { _id: string; title: string; slug: string; totalLessons: number; totalDuration: number };
  isEnrolled: boolean;
  progress: { completedLessons: string[]; lastLesson?: string; percentage: number };
  modules: LearnModule[];
}

/** Curriculum + progress for the course player sidebar. */
export function useCourseLearn(courseId: string) {
  return useQuery({
    queryKey: ['learn', courseId],
    queryFn: async (): Promise<LearnData> => {
      const { data } = await apiClient.get<ApiResponse<LearnData>>(`/learn/${courseId}`);
      return data.data;
    },
  });
}

/** A single lesson's full content (access-checked server-side). */
export function useLesson(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: ['learn', courseId, 'lesson', lessonId],
    enabled: Boolean(courseId && lessonId),
    queryFn: async (): Promise<ILesson> => {
      const { data } = await apiClient.get<ApiResponse<ILesson>>(
        `/learn/${courseId}/lessons/${lessonId}`,
      );
      return data.data;
    },
  });
}

export interface MarkProgressBody {
  lessonId: string;
  courseId: string;
  watchedSeconds?: number;
  isCompleted?: boolean;
}

interface MarkProgressResult {
  enrollmentProgress: IEnrollmentProgress;
}

/** Records watch progress / completion for a lesson. */
export function useMarkProgress(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation<MarkProgressResult, ApiErrorShape, MarkProgressBody>({
    mutationFn: async (body): Promise<MarkProgressResult> => {
      const { data } = await apiClient.post<ApiResponse<MarkProgressResult>>('/progress', body);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['learn', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'my'] });
    },
  });
}
