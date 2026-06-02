'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AdminCourseRow } from '@/hooks/useAdminCourses';

interface Props {
  rows: AdminCourseRow[];
  onFeature: (id: string) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Admin course-moderation table. */
export function CourseModTable({ rows, onFeature, onApprove, onDelete }: Props): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Course</th>
            <th className="px-4 py-3 font-medium">Instructor</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 text-right font-medium">Students</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c._id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link href={`/admin/courses/${c._id}`} className="flex items-center gap-3 hover:text-brand-primary">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                    {c.thumbnail && <Image src={c.thumbnail} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="line-clamp-1 font-medium">{c.title}</span>
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{c.instructor?.name ?? '—'}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{c.category}</span></td>
              <td className="px-4 py-3 text-right">{c.enrolledCount.toLocaleString('en-US')}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', c.isPublished ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground')}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {c.isFeatured && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">Featured</span>}
                  {!c.isApproved && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">Pending</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => onFeature(c._id)} className="text-muted-foreground hover:text-foreground">
                    {c.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>
                  {!c.isApproved && (
                    <button type="button" onClick={() => onApprove(c._id)} className="text-green-500 hover:underline">Approve</button>
                  )}
                  <button type="button" onClick={() => onDelete(c._id)} className="text-red-500 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
