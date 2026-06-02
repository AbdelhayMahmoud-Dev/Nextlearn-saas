'use client';

import Image from 'next/image';
import { getInitials, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/common/Pagination';
import type { StudentEnrollment } from '@/hooks/useInstructorStudents';

interface Props {
  enrollments: StudentEnrollment[];
  page: number;
  totalPages: number;
}

/** Table of students with progress, enrollment date, and pagination. */
export function StudentProgressTable({ enrollments, page, totalPages }: Props): JSX.Element {
  if (enrollments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">No students yet.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Course</th>
              <th className="pb-2 font-medium">Enrolled</th>
              <th className="pb-2 font-medium">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrollments.map((enrollment) => {
              const user = enrollment.userId;
              const course = enrollment.courseId;
              const pct = enrollment.progress?.percentage ?? 0;

              return (
                <tr key={enrollment._id}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                        {user?.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name ?? ''}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                            {getInitials(user?.name ?? '?')}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{user?.name ?? 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="line-clamp-1">{course?.title ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatDate(enrollment.enrolledAt)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-brand-primary transition-all"
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
