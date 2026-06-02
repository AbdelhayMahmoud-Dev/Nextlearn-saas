'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiResponse, IEnrollment, PaginationMeta } from '@/types';

interface StudentsQuery {
  courseId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

interface StudentsResult {
  items: IEnrollment[];
  meta: PaginationMeta;
}

/** Instructor's students list with optional course filter. */
export function useInstructorStudents(query: StudentsQuery = {}) {
  const tenantId = useTenantStore((s) => s.tenantId);
  return useQuery({
    queryKey: ['instructor-students', tenantId, query],
    queryFn: async (): Promise<StudentsResult> => {
      const params: Record<string, string | number> = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      };
      if (query.courseId) params.courseId = query.courseId;
      if (query.q) params.q = query.q;

      const { data } = await apiClient.get<ApiResponse<IEnrollment[]>>(
        '/analytics/instructor/students',
        { params },
      );
      return {
        items: data.data,
        meta: (data.meta as unknown as PaginationMeta | undefined) ?? {
          page: 1, limit: 20, total: data.data.length,
          totalPages: 1, hasNext: false, hasPrev: false,
        },
      };
    },
    staleTime: 60_000,
  });
}
