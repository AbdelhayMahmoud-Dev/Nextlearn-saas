'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { CourseModTable } from '@/components/admin/CourseModTable';
import {
  useAdminCourses,
  useApproveCourse,
  useDeleteCourse,
  useFeatureCourse,
} from '@/hooks/useAdminCourses';

/** Admin course-moderation list. */
export default function AdminCoursesPage(): JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useAdminCourses({ page, search: debounced || undefined, status: status || undefined });
  const feature = useFeatureCourse();
  const approve = useApproveCourse();
  const del = useDeleteCourse();

  const onFeature = (id: string): void => feature.mutate({ id }, { onError: (e) => toast.error(e.message) });
  const onApprove = (id: string): void => approve.mutate({ id }, { onSuccess: () => toast.success('Approved'), onError: (e) => toast.error(e.message) });
  const onDelete = (id: string): void => {
    if (!window.confirm('Permanently delete this course and all its content? This cannot be undone.')) return;
    del.mutate({ id }, { onSuccess: () => toast.success('Course deleted'), onError: (e) => toast.error(e.message) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Courses {data ? `(${data.meta.total})` : ''}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search courses" className="w-56 pl-8" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending approval</option>
          </select>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>
      ) : (
        <>
          <CourseModTable rows={data.items} onFeature={onFeature} onApprove={onApprove} onDelete={onDelete} />
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}
