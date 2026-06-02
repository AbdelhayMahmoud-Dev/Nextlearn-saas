'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiErrorShape, ApiResponse, ICourse } from '@/types';

const INSTRUCTOR_COURSES_KEY = ['instructor-courses'] as const;

/** All courses belonging to the current instructor. */
export function useInstructorCourses() {
  return useQuery({
    queryKey: INSTRUCTOR_COURSES_KEY,
    queryFn: async (): Promise<ICourse[]> => {
      const { data } = await apiClient.get<ApiResponse<ICourse[]>>('/courses/my');
      return data.data;
    },
    staleTime: 60_000,
  });
}

/** Single course for the editor (includes draft data). */
export function useCourseForEdit(courseId: string) {
  return useQuery({
    queryKey: ['course-edit', courseId],
    enabled: Boolean(courseId),
    queryFn: async (): Promise<ICourse> => {
      const { data } = await apiClient.get<ApiResponse<ICourse>>(`/courses/${courseId}/edit`);
      return data.data;
    },
    staleTime: 30_000,
  });
}

/** Create a new course. */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation<ICourse, ApiErrorShape, Partial<ICourse>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<ICourse>>('/courses', body);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTRUCTOR_COURSES_KEY });
    },
  });
}

/** Update an existing course. */
export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation<ICourse, ApiErrorShape, Partial<ICourse>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.put<ApiResponse<ICourse>>(`/courses/${courseId}`, body);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTRUCTOR_COURSES_KEY });
      void queryClient.invalidateQueries({ queryKey: ['course-edit', courseId] });
    },
  });
}

/** Publish a course. */
export function usePublishCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation<ICourse, ApiErrorShape>({
    mutationFn: async () => {
      const { data } = await apiClient.patch<ApiResponse<ICourse>>(
        `/courses/${courseId}/publish`,
      );
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTRUCTOR_COURSES_KEY });
      void queryClient.invalidateQueries({ queryKey: ['course-edit', courseId] });
    },
  });
}

/** Delete a course. */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (courseId) => {
      await apiClient.delete(`/courses/${courseId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTRUCTOR_COURSES_KEY });
    },
  });
}

/** Hook for module-related queries per course. */
export function useCourseModules(courseId: string) {
  const tenantId = useTenantStore((s) => s.tenantId);
  return useQuery({
    queryKey: ['course-modules', courseId, tenantId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<unknown[]>>(
        `/courses/${courseId}/modules`,
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}
