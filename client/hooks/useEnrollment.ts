'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, IEnrollment } from '@/types';

const MY_ENROLLMENTS_KEY = ['enrollments', 'my'] as const;

/**
 * Whether the current user may access a specific lesson's content.
 * The server returns 403 when a purchase is required; we map that to `false`.
 */
export function useLessonAccess(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: ['access', courseId, lessonId],
    queryFn: async (): Promise<boolean> => {
      try {
        await apiClient.get(`/enrollments/${courseId}/access/${lessonId}`);
        return true;
      } catch (err) {
        if ((err as ApiErrorShape).statusCode === 403) return false;
        throw err;
      }
    },
  });
}

/** Enrolls the current user in a (free) course. */
export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation<IEnrollment, ApiErrorShape, string>({
    mutationFn: async (courseId: string): Promise<IEnrollment> => {
      const { data } = await apiClient.post<ApiResponse<IEnrollment>>('/enrollments', { courseId });
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_ENROLLMENTS_KEY });
    },
  });
}

/** The current user's enrollments (with populated course). */
export function useMyCourses() {
  return useQuery({
    queryKey: MY_ENROLLMENTS_KEY,
    queryFn: async (): Promise<IEnrollment[]> => {
      const { data } = await apiClient.get<ApiResponse<IEnrollment[]>>('/enrollments/my');
      return data.data;
    },
  });
}
