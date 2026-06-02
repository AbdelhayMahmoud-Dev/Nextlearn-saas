'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, IEnrollment } from '@/types';

export interface DashboardStats {
  enrolledCount: number;
  hoursLearned: number;
  certificatesCount: number;
  streakDays: number;
}

export interface RecentActivityItem {
  lessonTitle: string;
  courseTitle: string;
  courseSlug: string;
  completedAt: string;
}

export interface ActivityPoint {
  date: string;
  count: number;
}

export interface StudentDashboard {
  stats: DashboardStats;
  continueLearning: IEnrollment[];
  recentActivity: RecentActivityItem[];
  activity: ActivityPoint[];
}

/** The authenticated student's dashboard aggregate. */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<StudentDashboard> => {
      const { data } = await apiClient.get<ApiResponse<StudentDashboard>>('/dashboard');
      return data.data;
    },
  });
}
