'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface FunnelStage {
  stage: string;
  count: number;
  rate: number;
}

export interface CohortRow {
  cohort: string;
  size: number;
  activated: number;
  activationRate: number;
}

export interface RetentionRow {
  month: string;
  total: number;
  retained: number;
  retentionRate: number;
}

export interface ForecastPoint {
  month: string;
  revenue: number;
  projected?: boolean;
}

export interface RevenueForecast {
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  trend: { monthlyChange: number; direction: 'up' | 'down' | 'flat' };
}

export interface CoursePerformanceRow {
  courseId: string;
  title: string;
  category: string;
  enrollments: number;
  completionRate: number;
  avgProgress: number;
  rating: number;
  revenue: number;
}

export interface InstructorPerformanceRow {
  instructorId: string;
  name: string;
  email: string;
  courses: number;
  published: number;
  students: number;
  avgRating: number;
  revenue: number;
}

function useResource<T>(path: string, key: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async (): Promise<T> => (await apiClient.get<ApiResponse<T>>(path)).data.data,
  });
}

export const useAnalyticsFunnel = () =>
  useResource<FunnelStage[]>('/admin/analytics/funnel', 'adv-funnel');
export const useAnalyticsCohorts = () =>
  useResource<CohortRow[]>('/admin/analytics/cohorts', 'adv-cohorts');
export const useAnalyticsRetention = () =>
  useResource<RetentionRow[]>('/admin/analytics/retention', 'adv-retention');
export const useRevenueForecast = () =>
  useResource<RevenueForecast>('/admin/analytics/forecast', 'adv-forecast');
export const useCoursePerformance = () =>
  useResource<CoursePerformanceRow[]>('/admin/analytics/course-performance', 'adv-course-perf');
export const useInstructorPerformance = () =>
  useResource<InstructorPerformanceRow[]>(
    '/admin/analytics/instructor-performance',
    'adv-instructor-perf',
  );
