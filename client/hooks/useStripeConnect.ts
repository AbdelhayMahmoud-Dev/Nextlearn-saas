'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse } from '@/types';

export interface StripeConnectStatus {
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  stripeOnboardingComplete: boolean;
}

export function useStripeConnect() {
  return useQuery({
    queryKey: ['stripe-connect'],
    queryFn: async (): Promise<StripeConnectStatus> =>
      (await apiClient.get<ApiResponse<StripeConnectStatus>>('/admin/stripe/status')).data.data,
  });
}

export function useCreateConnectAccount() {
  const qc = useQueryClient();
  return useMutation<{ accountId: string }, ApiErrorShape, void>({
    mutationFn: async () =>
      (await apiClient.post<ApiResponse<{ accountId: string }>>('/admin/stripe/connect')).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['stripe-connect'] }),
  });
}

export function useGetOnboardingLink() {
  return useMutation<string, ApiErrorShape, void>({
    mutationFn: async () =>
      (await apiClient.post<ApiResponse<{ url: string }>>('/admin/stripe/onboarding-link')).data.data.url,
    onSuccess: (url) => { window.location.href = url; },
  });
}

export function useGetLoginLink() {
  return useMutation<string, ApiErrorShape, void>({
    mutationFn: async () =>
      (await apiClient.post<ApiResponse<{ url: string }>>('/admin/stripe/login-link')).data.data.url,
    onSuccess: (url) => { window.open(url, '_blank', 'noopener,noreferrer'); },
  });
}
