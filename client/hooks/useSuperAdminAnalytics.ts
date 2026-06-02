'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface GlobalAnalytics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  platformFeeRevenue: number;
  totalEnrollments: number;
  totalCourses: number;
  newTenantsThisMonth: number;
  revenueByTenant: Array<{ tenantId: string; tenantName: string; revenue: number; userCount: number }>;
  monthlyNewTenants: Array<{ month: string; count: number }>;
}

export function useGlobalAnalytics() {
  return useQuery({
    queryKey: ['sa-analytics'],
    queryFn: async (): Promise<GlobalAnalytics> =>
      (await apiClient.get<ApiResponse<GlobalAnalytics>>('/superadmin/analytics')).data.data,
    staleTime: 5 * 60 * 1000,
  });
}
