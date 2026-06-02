'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, IPayment, ISubscription, PaginatedResponse, PaginationMeta } from '@/types';

type UserLite = { _id: string; name: string; email: string; avatar?: string };
export interface AdminPaymentRow extends IPayment {
  user: UserLite | null;
  course: { _id: string; title: string; slug: string } | null;
}
export interface AdminSubscriptionRow extends ISubscription {
  user: UserLite | null;
}

export function useAdminPayments(filters: { page: number; status?: string; type?: string }) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '20' });
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  return useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: async (): Promise<{ items: AdminPaymentRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AdminPaymentRow>>(`/admin/payments?${params.toString()}`);
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useAdminSubscriptions(filters: { page: number; status?: string; plan?: string }) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '20' });
  if (filters.status) params.set('status', filters.status);
  if (filters.plan) params.set('plan', filters.plan);
  return useQuery({
    queryKey: ['admin-subscriptions', filters],
    queryFn: async (): Promise<{ items: AdminSubscriptionRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AdminSubscriptionRow>>(`/admin/subscriptions?${params.toString()}`);
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, { id: string; reason?: string }>({
    mutationFn: async ({ id, reason }) => {
      await apiClient.post(`/admin/payments/${id}/refund`, { reason });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-payments'] }),
  });
}
