'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface AdminKpis {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowth: number;
  totalEnrollments: number;
  newEnrollmentsThisMonth: number;
  enrollmentGrowth: number;
  totalCourses: number;
  publishedCourses: number;
  averageRating: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  enrollments: number;
  subscriptions: number;
}
export interface UserGrowthPoint {
  date: string;
  count: number;
}
export interface TopCourseRow {
  courseId: string;
  title: string;
  thumbnail?: string;
  enrollments: number;
  revenue: number;
  rating: number;
  completionRate: number;
}
export interface CategoryRow {
  category: string;
  enrollments: number;
  revenue: number;
  courseCount: number;
}

const STALE = 5 * 60 * 1000;
async function get<T>(path: string): Promise<T> {
  return (await apiClient.get<ApiResponse<T>>(path)).data.data;
}

export function useAdminKpis() {
  return useQuery({ queryKey: ['admin-kpis'], queryFn: () => get<AdminKpis>('/admin/analytics/kpis'), staleTime: STALE });
}
export function useAdminRevenueChart() {
  return useQuery({ queryKey: ['admin-revenue'], queryFn: () => get<RevenuePoint[]>('/admin/analytics/revenue-chart'), staleTime: STALE });
}
export function useAdminUserGrowth() {
  return useQuery({ queryKey: ['admin-user-growth'], queryFn: () => get<UserGrowthPoint[]>('/admin/analytics/user-growth'), staleTime: STALE });
}
export function useAdminTopCourses() {
  return useQuery({ queryKey: ['admin-top-courses'], queryFn: () => get<TopCourseRow[]>('/admin/analytics/top-courses'), staleTime: STALE });
}
export function useAdminCategories() {
  return useQuery({ queryKey: ['admin-categories'], queryFn: () => get<CategoryRow[]>('/admin/analytics/categories'), staleTime: STALE });
}
