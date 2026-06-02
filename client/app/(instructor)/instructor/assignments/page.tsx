'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { useInstructorAssignments } from '@/hooks/useAssignments';
import { formatDate } from '@/lib/utils';

/** List of all assignments for the instructor. */
export default function InstructorAssignmentsPage(): JSX.Element {
  const { data: assignments, isLoading, isError, refetch } = useInstructorAssignments();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <ErrorState title="Couldn't load assignments" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Assignments</h1>

      {!assignments?.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Create assignments inside your course curriculum editor."
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div>
                <p className="font-semibold">{a.title}</p>
                {a.dueDate && (
                  <p className="text-xs text-muted-foreground">Due: {formatDate(a.dueDate)}</p>
                )}
              </div>
              <Link
                href={`/instructor/assignments/${a._id}/submissions`}
                className="text-sm text-brand-primary hover:underline"
              >
                View Submissions →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
