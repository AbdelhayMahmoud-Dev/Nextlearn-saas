'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, ICourse, IModule, PaginatedResponse, PaginationMeta } from '@/types';

export interface AdminCourseRow extends Omit<ICourse, 'instructor'> {
  instructor: { _id: string; name: string; avatar?: string } | null;
}
export interface AdminCourseFilters {
  page: number;
  status?: string;
  category?: string;
  search?: string;
}
export interface AdminCourseDetail extends Omit<ICourse, 'instructor'> {
  instructor: { _id: string; name: string; email: string; avatar?: string; bio?: string } | null;
  modules: (IModule & { lessons: { _id: string; title: string; type: string }[] })[];
}

export function useAdminCourses(filters: AdminCourseFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: '20' });
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  return useQuery({
    queryKey: ['admin-courses', filters],
    queryFn: async (): Promise<{ items: AdminCourseRow[]; meta: PaginationMeta }> => {
      const res = await apiClient.get<PaginatedResponse<AdminCourseRow>>(`/admin/courses?${params.toString()}`);
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: ['admin-course', id],
    queryFn: async (): Promise<AdminCourseDetail> =>
      (await apiClient.get<ApiResponse<AdminCourseDetail>>(`/admin/courses/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

function useCourseAction(method: (id: string, body?: unknown) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation<unknown, ApiErrorShape, { id: string; body?: unknown }>({
    mutationFn: ({ id, body }) => method(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-courses'] });
      void qc.invalidateQueries({ queryKey: ['admin-course'] });
    },
  });
}

export const useFeatureCourse = () => useCourseAction((id) => apiClient.patch(`/admin/courses/${id}/feature`));
export const useApproveCourse = () => useCourseAction((id) => apiClient.patch(`/admin/courses/${id}/approve`));
export const useRejectCourse = () =>
  useCourseAction((id, body) => apiClient.patch(`/admin/courses/${id}/reject`, body));
export const useDeleteCourse = () => useCourseAction((id) => apiClient.delete(`/admin/courses/${id}`));
