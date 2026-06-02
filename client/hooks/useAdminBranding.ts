'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, IWhiteLabel } from '@/types';

export interface BrandingInput {
  platformName?: string;
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  defaultLanguage?: string;
}

export function useAdminBranding() {
  return useQuery({
    queryKey: ['admin-branding'],
    queryFn: async (): Promise<IWhiteLabel> =>
      (await apiClient.get<ApiResponse<IWhiteLabel>>('/admin/settings/branding')).data.data,
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation<IWhiteLabel, ApiErrorShape, BrandingInput>({
    mutationFn: async (body) =>
      (await apiClient.put<ApiResponse<IWhiteLabel>>('/admin/settings/branding', body)).data.data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-branding'] }),
  });
}
