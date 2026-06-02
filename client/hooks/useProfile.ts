'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ISocialLinks, IUser } from '@/types';

const ME_KEY = ['me'] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<IUser> => (await apiClient.get<ApiResponse<IUser>>('/users/me')).data.data,
  });
}

export interface UpdateProfileBody {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: ISocialLinks;
  preferences?: Partial<IUser['preferences']>;
}

/** Profile update with optimistic cache update + rollback. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<IUser, ApiErrorShape, UpdateProfileBody, { previous?: IUser }>({
    mutationFn: async (body) => (await apiClient.patch<ApiResponse<IUser>>('/users/me', body)).data.data,
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ME_KEY });
      const previous = queryClient.getQueryData<IUser>(ME_KEY);
      if (previous) {
        queryClient.setQueryData<IUser>(ME_KEY, {
          ...previous,
          ...body,
          socialLinks: { ...previous.socialLinks, ...body.socialLinks },
          preferences: { ...previous.preferences, ...body.preferences },
        });
      }
      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) queryClient.setQueryData(ME_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useChangePassword() {
  return useMutation<void, ApiErrorShape, { currentPassword: string; newPassword: string }>({
    mutationFn: async (body) => {
      await apiClient.post('/users/me/change-password', body);
    },
  });
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async (): Promise<number> =>
      (await apiClient.get<ApiResponse<{ count: number }>>('/users/me/sessions')).data.data.count,
  });
}

export function useSignOutAll() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiErrorShape, void>({
    mutationFn: async () => {
      await apiClient.post('/users/me/sign-out-all', {});
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
