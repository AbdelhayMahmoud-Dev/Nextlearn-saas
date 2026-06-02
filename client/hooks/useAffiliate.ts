'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, PaginatedResponse, PaginationMeta } from '@/types';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed';
export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'failed';

export interface AffiliateAccount {
  id: string;
  code: string;
  status: 'active' | 'suspended';
  commissionRate: number;
  payoutEmail: string | null;
  pendingCents: number;
  paidCents: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
}

export interface AffiliateDashboard {
  account: AffiliateAccount;
  minPayoutCents: number;
  recentCommissions: Array<{
    id: string;
    amountCents: number;
    orderAmountCents: number;
    rate: number;
    status: CommissionStatus;
    createdAt: string;
  }>;
}

export interface CommissionRow {
  id: string;
  amountCents: number;
  orderAmountCents: number;
  rate: number;
  status: CommissionStatus;
  courseId: string | null;
  createdAt: string;
}

export interface PayoutRow {
  id: string;
  amountCents: number;
  method: string;
  status: PayoutStatus;
  reference: string | null;
  createdAt: string;
  processedAt: string | null;
}

const get = async <T,>(path: string): Promise<T> =>
  (await apiClient.get<ApiResponse<T>>(path)).data.data;

export const useAffiliateDashboard = () =>
  useQuery({ queryKey: ['affiliate-dashboard'], queryFn: () => get<AffiliateDashboard>('/affiliate/me') });

export function useUpdatePayoutEmail() {
  const qc = useQueryClient();
  return useMutation<{ payoutEmail: string | null }, ApiErrorShape, string>({
    mutationFn: async (email) =>
      (await apiClient.patch<ApiResponse<{ payoutEmail: string | null }>>(
        '/affiliate/me/payout-email',
        { email },
      )).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] }),
  });
}

export function useAffiliateCommissions(page: number) {
  return useQuery({
    queryKey: ['affiliate-commissions', page],
    queryFn: async (): Promise<{ items: CommissionRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<CommissionRow>>(
        `/affiliate/commissions?page=${page}&limit=20`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useAffiliatePayouts(page: number) {
  return useQuery({
    queryKey: ['affiliate-payouts', page],
    queryFn: async (): Promise<{ items: PayoutRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<PayoutRow>>(
        `/affiliate/payouts?page=${page}&limit=20`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation<{ id: string; amountCents: number; status: PayoutStatus }, ApiErrorShape, void>({
    mutationFn: async () =>
      (await apiClient.post<ApiResponse<{ id: string; amountCents: number; status: PayoutStatus }>>(
        '/affiliate/payouts/request',
        {},
      )).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['affiliate-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['affiliate-payouts'] });
      void qc.invalidateQueries({ queryKey: ['affiliate-commissions'] });
    },
  });
}

/* ───────────────────────── Admin ───────────────────────── */

export interface AdminAffiliateRow {
  id: string;
  code: string;
  status: 'active' | 'suspended';
  commissionRate: number;
  pendingCents: number;
  paidCents: number;
  totalClicks: number;
  totalConversions: number;
  user: { _id: string; name: string; email: string } | null;
}

export interface AdminAffiliateOverview {
  affiliates: number;
  pendingCents: number;
  paidCents: number;
  totalConversions: number;
}

export interface AdminPayoutRow extends PayoutRow {
  affiliateCode: string | null;
}

export const useAdminAffiliateOverview = () =>
  useQuery({
    queryKey: ['admin-affiliate-overview'],
    queryFn: () => get<AdminAffiliateOverview>('/admin/affiliates/overview'),
  });

export function useAdminAffiliates(page: number) {
  return useQuery({
    queryKey: ['admin-affiliates', page],
    queryFn: async (): Promise<{ items: AdminAffiliateRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AdminAffiliateRow>>(
        `/admin/affiliates?page=${page}&limit=25`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useSetAffiliateStatus() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiErrorShape, { id: string; status: 'active' | 'suspended' }>({
    mutationFn: async ({ id, status }) =>
      (await apiClient.patch(`/admin/affiliates/${id}/status`, { status })).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-affiliates'] }),
  });
}

export function useSetAffiliateRate() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiErrorShape, { id: string; rate: number }>({
    mutationFn: async ({ id, rate }) =>
      (await apiClient.patch(`/admin/affiliates/${id}/rate`, { rate })).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-affiliates'] }),
  });
}

export function useAdminAffiliatePayouts(page: number) {
  return useQuery({
    queryKey: ['admin-affiliate-payouts', page],
    queryFn: async (): Promise<{ items: AdminPayoutRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AdminPayoutRow>>(
        `/admin/affiliates/payouts/all?page=${page}&limit=25`,
      );
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useMarkPayoutPaid() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiErrorShape, { id: string; reference?: string }>({
    mutationFn: async ({ id, reference }) =>
      (await apiClient.post(`/admin/affiliates/payouts/${id}/paid`, { reference })).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-affiliate-payouts'] });
      void qc.invalidateQueries({ queryKey: ['admin-affiliate-overview'] });
      void qc.invalidateQueries({ queryKey: ['admin-affiliates'] });
    },
  });
}
