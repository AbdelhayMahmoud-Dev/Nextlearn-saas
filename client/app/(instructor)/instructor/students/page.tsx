'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable';
import { ErrorState } from '@/components/common/ErrorState';
import { useInstructorStudents } from '@/hooks/useInstructorStudents';
import { useInstructorCourses } from '@/hooks/useInstructorCourses';
import { useDebounce } from '@/hooks/useDebounce';

/** Instructor students page with search, course filter, and paginated table. */
export default function InstructorStudentsPage(): JSX.Element {
  const sp = useSearchParams();
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: courses } = useInstructorCourses();
  const { data, isLoading, isError, refetch } = useInstructorStudents({
    q: debouncedSearch || undefined,
    courseId: courseId || undefined,
    page,
    limit: 20,
  });

  if (isError) return <ErrorState title="Couldn't load students" onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Students</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
            aria-label="Search students"
          />
        </div>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          aria-label="Filter by course"
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Courses</option>
          {courses?.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <StudentProgressTable
          enrollments={data?.items ?? []}
          page={page}
          totalPages={data?.meta?.totalPages ?? 1}
        />
      )}
    </div>
  );
}
