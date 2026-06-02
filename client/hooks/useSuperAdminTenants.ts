'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ITenant, PaginatedResponse, PaginationMeta, TenantPlan } from '@/types';

export interface TenantKpis {
  userCount: number;
  courseCount: number;
  enrollmentCount: number;
  monthlyRevenue: number;
}
export interface TenantRow extends ITenant {
  kpis: TenantKpis;
}
export interface TenantFilters {
  page: number;
  search?: string;
  plan?: string;
  isActive?: string;
}
export interface CreateTenantInput {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  plan: TenantPlan;
  planExpiresAt?: string;
}

export function useSuperAdminTenants(filters: TenantFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '20' });
  if (filters.search) params.set('search', filters.search);
  if (filters.plan) params.set('plan', filters.plan);
  if (filters.isActive) params.set('isActive', filters.isActive);
  return useQuery({
    queryKey: ['sa-tenants', filters],
    queryFn: async (): Promise<{ items: TenantRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<TenantRow>>(`/superadmin/tenants?${params.toString()}`);
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useSuperAdminTenant(id: string) {
  return useQuery({
    queryKey: ['sa-tenant', id],
    queryFn: async (): Promise<TenantRow> =>
      (await apiClient.get<ApiResponse<TenantRow>>(`/superadmin/tenants/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation<{ tenant: ITenant; adminEmail: string }, ApiErrorShape, CreateTenantInput>({
    mutationFn: async (body) =>
      (await apiClient.post<ApiResponse<{ tenant: ITenant; adminEmail: string }>>('/superadmin/tenants', body)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sa-tenants'] }),
  });
}

export function useToggleTenantStatus() {
  const qc = useQueryClient();
  return useMutation<ITenant, ApiErrorShape, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) =>
      (await apiClient.patch<ApiResponse<ITenant>>(`/superadmin/tenants/${id}/status`, { isActive })).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sa-tenants'] });
      void qc.invalidateQueries({ queryKey: ['sa-tenant'] });
    },
  });
}

export function useUpdateTenantPlan() {
  const qc = useQueryClient();
  return useMutation<ITenant, ApiErrorShape, { id: string; plan: TenantPlan; planExpiresAt?: string | null }>({
    mutationFn: async ({ id, plan, planExpiresAt }) =>
      (await apiClient.patch<ApiResponse<ITenant>>(`/superadmin/tenants/${id}/plan`, { plan, planExpiresAt })).data.data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sa-tenants'] });
      void qc.invalidateQueries({ queryKey: ['sa-tenant'] });
    },
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, { id: string; confirmSlug: string }>({
    mutationFn: async ({ id, confirmSlug }) => {
      await apiClient.delete(`/superadmin/tenants/${id}`, { data: { confirmSlug } });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sa-tenants'] }),
  });
}
