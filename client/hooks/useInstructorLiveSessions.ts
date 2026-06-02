'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ILiveSession } from '@/types';

const LS_KEY = ['instructor-live-sessions'] as const;

export function useInstructorLiveSessions() {
  return useQuery({
    queryKey: LS_KEY,
    queryFn: async (): Promise<ILiveSession[]> => {
      const { data } = await apiClient.get<ApiResponse<ILiveSession[]>>('/live-sessions');
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateLiveSession() {
  const qc = useQueryClient();
  return useMutation<ILiveSession, ApiErrorShape, Partial<ILiveSession>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<ILiveSession>>('/live-sessions', body);
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: LS_KEY }),
  });
}

export function useUpdateLiveSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation<ILiveSession, ApiErrorShape, Partial<ILiveSession>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.put<ApiResponse<ILiveSession>>(
        `/live-sessions/${sessionId}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: LS_KEY }),
  });
}

export function useStartSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation<ILiveSession, ApiErrorShape>({
    mutationFn: async () => {
      const { data } = await apiClient.patch<ApiResponse<ILiveSession>>(
        `/live-sessions/${sessionId}/start`,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: LS_KEY }),
  });
}

export function useEndSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation<ILiveSession, ApiErrorShape>({
    mutationFn: async () => {
      const { data } = await apiClient.patch<ApiResponse<ILiveSession>>(
        `/live-sessions/${sessionId}/end`,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: LS_KEY }),
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (sessionId) => {
      await apiClient.delete(`/live-sessions/${sessionId}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: LS_KEY }),
  });
}
