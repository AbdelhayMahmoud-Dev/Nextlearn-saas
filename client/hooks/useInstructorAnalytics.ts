'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiResponse, ICourse, IUser } from '@/types';

export interface OverviewStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalStudents: number;
  newStudentsThisMonth: number;
  totalCourses: number;
  publishedCourses: number;
  averageRating: number;
  totalReviews: number;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
  enrollments: number;
}

export interface TopCourseItem {
  course?: Pick<ICourse, '_id' | 'title' | 'slug' | 'thumbnail' | 'rating'>;
  enrollments: number;
  revenue: number;
  completionRate: number;
  averageRating: number;
}

export interface RecentEnrollmentItem {
  student?: Pick<IUser, '_id' | 'name' | 'email' | 'avatar'>;
  course?: Pick<ICourse, '_id' | 'title' | 'slug' | 'thumbnail'>;
  enrolledAt: string;
}

export interface InstructorDashboardData {
  overview: OverviewStats;
  revenueChart: RevenueChartPoint[];
  topCourses: TopCourseItem[];
  recentEnrollments: RecentEnrollmentItem[];
}

/** Instructor analytics dashboard — stale time 5 min (analytics don't need real-time). */
export function useInstructorAnalytics() {
  const tenantId = useTenantStore((s) => s.tenantId);
  return useQuery({
    queryKey: ['instructor-analytics', tenantId],
    queryFn: async (): Promise<InstructorDashboardData> => {
      const { data } = await apiClient.get<ApiResponse<InstructorDashboardData>>(
        '/analytics/instructor/dashboard',
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Instructor revenue data. */
export function useInstructorRevenue() {
  const tenantId = useTenantStore((s) => s.tenantId);
  return useQuery({
    queryKey: ['instructor-revenue', tenantId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<unknown>>('/analytics/instructor/revenue');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
