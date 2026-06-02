'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ICoupon, PaginatedResponse } from '@/types';

export interface CouponInput {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxUses: number;
  expiresAt?: string | null;
  applicableCourses: string[];
  isActive: boolean;
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async (): Promise<ICoupon[]> =>
      (await apiClient.get<PaginatedResponse<ICoupon>>('/coupons?page=1&limit=100')).data.data,
  });
}

/** Lightweight course options for the applicable-courses multi-select. */
export function useCourseOptions() {
  return useQuery({
    queryKey: ['admin-course-options'],
    queryFn: async (): Promise<{ _id: string; title: string }[]> => {
      const res = await apiClient.get<PaginatedResponse<{ _id: string; title: string }>>(
        '/admin/courses?page=1&limit=100',
      );
      return res.data.data.map((c) => ({ _id: c._id, title: c.title }));
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation<ICoupon, ApiErrorShape, CouponInput>({
    mutationFn: async (body) => (await apiClient.post<ApiResponse<ICoupon>>('/coupons', body)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation<ICoupon, ApiErrorShape, { id: string; body: Partial<CouponInput> }>({
    mutationFn: async ({ id, body }) => (await apiClient.put<ApiResponse<ICoupon>>(`/coupons/${id}`, body)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/coupons/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}
