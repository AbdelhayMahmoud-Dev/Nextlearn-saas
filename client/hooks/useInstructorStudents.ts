'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTenantStore } from '@/store/tenantStore';
import type { PaginatedResponse, PaginationMeta } from '@/types';

interface StudentsQuery {
  courseId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

/** An enrollment row with `userId`/`courseId` populated by the API. */
export interface StudentEnrollment {
  _id: string;
  userId: { name?: string; email?: string; avatar?: string } | null;
  courseId: { title?: string; slug?: string; thumbnail?: string } | null;
  progress?: { percentage?: number };
  enrolledAt: string;
}

interface StudentsResult {
  items: StudentEnrollment[];
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

      const { data } = await apiClient.get<PaginatedResponse<StudentEnrollment>>(
        '/analytics/instructor/students',
        { params },
      );
      return { items: data.data, meta: data.meta };
    },
    staleTime: 60_000,
  });
}
