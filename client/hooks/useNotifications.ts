'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, INotification, PaginatedResponse, PaginationMeta } from '@/types';

interface NotificationsPage {
  items: INotification[];
  meta: PaginationMeta;
}

/**
 * Paginated notifications (infinite scroll). The query keys are structured so a
 * future Socket.io listener can invalidate them for realtime updates.
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<NotificationsPage> => {
      const res = await apiClient.get<PaginatedResponse<INotification>>(
        `/notifications?page=${pageParam}&limit=15`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async (): Promise<number> =>
      (await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count')).data.data
        .count,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
