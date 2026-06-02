'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, IModule, ILesson } from '@/types';

export type ModuleWithLessons = Omit<IModule, 'lessons'> & { lessons: ILesson[] };

/** Full curriculum for a course — modules + their lessons. */
export function useCurriculumModules(courseId: string) {
  return useQuery({
    queryKey: ['curriculum', courseId],
    enabled: Boolean(courseId),
    queryFn: async (): Promise<ModuleWithLessons[]> => {
      const { data } = await apiClient.get<ApiResponse<ModuleWithLessons[]>>(
        `/courses/${courseId}/modules`,
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}

/** Create a new module. */
export function useCreateModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation<IModule, ApiErrorShape, { title: string }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<IModule>>(
        `/courses/${courseId}/modules`,
        body,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Update a module's title or publish state. */
export function useUpdateModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation<IModule, ApiErrorShape, { id: string; body: Partial<IModule> }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await apiClient.put<ApiResponse<IModule>>(
        `/courses/${courseId}/modules/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Reorder modules via drag-and-drop. */
export function useReorderModules(courseId: string) {
  const qc = useQueryClient();
  return useMutation<IModule[], ApiErrorShape, string[]>({
    mutationFn: async (orderedIds) => {
      const { data } = await apiClient.patch<ApiResponse<IModule[]>>(
        `/courses/${courseId}/modules/reorder`,
        { orderedIds },
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Delete a module (only if no published lessons). */
export function useDeleteModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (moduleId) => {
      await apiClient.delete(`/courses/${courseId}/modules/${moduleId}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Create a lesson inside a module. */
export function useCreateLesson(courseId: string, moduleId: string) {
  const qc = useQueryClient();
  return useMutation<ILesson, ApiErrorShape, Partial<ILesson>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<ILesson>>(
        `/courses/${courseId}/modules/${moduleId}/lessons`,
        body,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Update a lesson. */
export function useUpdateLesson(courseId: string, moduleId: string) {
  const qc = useQueryClient();
  return useMutation<ILesson, ApiErrorShape, { id: string; body: Partial<ILesson> }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await apiClient.put<ApiResponse<ILesson>>(
        `/courses/${courseId}/modules/${moduleId}/lessons/${id}`,
        body,
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Reorder lessons within a module. */
export function useReorderLessons(courseId: string, moduleId: string) {
  const qc = useQueryClient();
  return useMutation<ILesson[], ApiErrorShape, string[]>({
    mutationFn: async (orderedIds) => {
      const { data } = await apiClient.patch<ApiResponse<ILesson[]>>(
        `/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
        { orderedIds },
      );
      return data.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}

/** Delete a lesson. */
export function useDeleteLesson(courseId: string, moduleId: string) {
  const qc = useQueryClient();
  return useMutation<void, ApiErrorShape, string>({
    mutationFn: async (lessonId) => {
      await apiClient.delete(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
      );
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['curriculum', courseId] }),
  });
}
