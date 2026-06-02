'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, IProgress } from '@/types';

/** All of the current user's progress records for a course (for resume + checkmarks). */
export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['progress', courseId],
    enabled: Boolean(courseId),
    queryFn: async (): Promise<IProgress[]> => {
      const { data } = await apiClient.get<ApiResponse<IProgress[]>>(`/progress/${courseId}`);
      return data.data;
    },
  });
}
