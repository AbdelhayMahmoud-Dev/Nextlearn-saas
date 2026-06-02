'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiErrorShape, ApiResponse, IAssignment, ISubmission } from '@/types';

/** List assignments for the instructor (by courseId via lesson). */
export function useInstructorAssignments(courseId?: string) {
  return useQuery({
    queryKey: ['instructor-assignments', courseId],
    queryFn: async (): Promise<IAssignment[]> => {
      // Fetch all submissions across the course by getting assignments
      // Server returns assignments tied to lessons in this course
      const { data } = await apiClient.get<ApiResponse<IAssignment[]>>('/assignments', {
        params: courseId ? { courseId } : {},
      }).catch(() => ({ data: { data: [] as IAssignment[] } }));
      return data.data ?? [];
    },
    staleTime: 60_000,
  });
}

/** Fetch submissions for an assignment with student info. */
export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    enabled: Boolean(assignmentId),
    queryFn: async (): Promise<ISubmission[]> => {
      const { data } = await apiClient.get<ApiResponse<ISubmission[]>>(
        `/assignments/${assignmentId}/submissions`,
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}

/** Grade a submission. */
export function useGradeSubmission(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation<
    ISubmission,
    ApiErrorShape,
    { subId: string; score: number; feedback: string }
  >({
    mutationFn: async ({ subId, score, feedback }) => {
      const { data } = await apiClient.put<ApiResponse<ISubmission>>(
        `/assignments/${assignmentId}/submissions/${subId}`,
        { score, feedback },
      );
      return data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
    },
  });
}
