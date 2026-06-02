import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import type { TopCourseRow } from '@/hooks/useAdminAnalytics';

/** Ranked table of the top courses by enrollment. */
export function TopCoursesWidget({ rows }: { rows: TopCourseRow[] }): JSX.Element {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No course data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th className="py-2 font-medium">#</th>
            <th className="py-2 font-medium">Course</th>
            <th className="py-2 text-right font-medium">Enrollments</th>
            <th className="py-2 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.courseId} className="border-t">
              <td className="py-2 text-muted-foreground">{i + 1}</td>
              <td className="py-2">
                <Link href={`/admin/courses/${r.courseId}`} className="line-clamp-1 hover:text-brand-primary">
                  {r.title}
                </Link>
              </td>
              <td className="py-2 text-right">{r.enrollments.toLocaleString('en-US')}</td>
              <td className="py-2 text-right">{formatPrice(r.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
