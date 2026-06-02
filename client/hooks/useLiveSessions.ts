'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ILiveSession } from '@/types';

export interface UpcomingSession extends ILiveSession {
  course?: { _id: string; title: string; slug: string };
}

/** Upcoming live sessions for the user's enrolled courses. */
export function useUpcomingSessions() {
  return useQuery({
    queryKey: ['live-sessions', 'upcoming'],
    queryFn: async (): Promise<UpcomingSession[]> =>
      (await apiClient.get<ApiResponse<UpcomingSession[]>>('/live-sessions/upcoming')).data.data,
  });
}
