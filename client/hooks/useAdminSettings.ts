'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse } from '@/types';

export interface TenantSettings {
  _id: string;
  tenantId: string;
  platformName: string;
  supportEmail: string;
  defaultLanguage: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: string;
  passwordMinLength: number;
  maxCoursesPerInstructor: number;
  commissionRate: number;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<TenantSettings> =>
      (await apiClient.get<ApiResponse<TenantSettings>>('/admin/settings')).data.data,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation<TenantSettings, ApiErrorShape, Partial<TenantSettings>>({
    mutationFn: async (body) =>
      (await apiClient.put<ApiResponse<TenantSettings>>('/admin/settings/general', body)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  });
}
