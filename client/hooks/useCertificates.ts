'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ICertificate } from '@/types';

/** The current user's issued certificates (with populated course). */
export function useMyCertificates() {
  return useQuery({
    queryKey: ['certificates', 'my'],
    queryFn: async (): Promise<ICertificate[]> => {
      const { data } = await apiClient.get<ApiResponse<ICertificate[]>>('/certificates/my');
      return data.data;
    },
  });
}

/** Issues a certificate for a completed course (idempotent). */
export function useGenerateCertificate() {
  const queryClient = useQueryClient();
  return useMutation<ICertificate, ApiErrorShape, string>({
    mutationFn: async (courseId): Promise<ICertificate> => {
      const { data } = await apiClient.post<ApiResponse<ICertificate>>('/certificates/generate', {
        courseId,
      });
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['certificates', 'my'] });
    },
  });
}
