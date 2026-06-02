'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import {
  useAnalyticsCohorts,
  useAnalyticsFunnel,
  useAnalyticsRetention,
  useCoursePerformance,
  useInstructorPerformance,
  useRevenueForecast,
} from '@/hooks/useAdminAdvancedAnalytics';
import { formatPrice } from '@/lib/utils';

const fallback = <div className="skeleton h-[300px] w-full rounded-lg" />;
const ForecastChart = dynamic(
  () => import('@/components/admin/ForecastChart').then((m) => m.ForecastChart),
  { ssr: false, loading: () => fallback },
);

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function AdvancedAnalyticsPage(): JSX.Element {
  const funnel = useAnalyticsFunnel();
  const cohorts = useAnalyticsCohorts();
  const retention = useAnalyticsRetention();
  const forecast = useRevenueForecast();
  const coursePerf = useCoursePerformance();
  const instructorPerf = useInstructorPerformance();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/analytics"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back to analytics"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-heading text-2xl font-bold">Advanced Insights</h1>
      </div>

      {/* Funnel */}
      <Section title="Conversion funnel">
        {funnel.data ? (
          <div className="space-y-3">
            {funnel.data.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.stage}</span>
                  <span className="text-muted-foreground">
                    {s.count.toLocaleString('en-US')} · {s.rate}%
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: `${s.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="skeleton h-32 w-full rounded-lg" />
        )}
      </Section>

      {/* Forecast */}
      <Section title="Revenue forecast (3-month projection)">
        {forecast.data ? (
          <>
            <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              {forecast.data.trend.direction === 'down' ? (
                <TrendingDown className="size-4 text-destructive" />
              ) : (
                <TrendingUp className="size-4 text-emerald-500" />
              )}
              Trend: {formatPrice(Math.abs(forecast.data.trend.monthlyChange))}/mo{' '}
              {forecast.data.trend.direction}
            </p>
            <ForecastChart data={forecast.data} />
          </>
        ) : (
          fallback
        )}
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cohorts */}
        <Section title="Signup cohorts → activation">
          {cohorts.data ? (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Cohort</th>
                  <th className="py-2 font-medium">Size</th>
                  <th className="py-2 font-medium">Activated</th>
                  <th className="py-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.data.map((c) => (
                  <tr key={c.cohort} className="border-t">
                    <td className="py-2">{c.cohort}</td>
                    <td className="py-2">{c.size}</td>
                    <td className="py-2">{c.activated}</td>
                    <td className="py-2">{c.activationRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="skeleton h-48 w-full rounded-lg" />
          )}
        </Section>

        {/* Retention */}
        <Section title="Engagement retention">
          {retention.data ? (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Month</th>
                  <th className="py-2 font-medium">Enrolled</th>
                  <th className="py-2 font-medium">Retained</th>
                  <th className="py-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {retention.data.map((r) => (
                  <tr key={r.month} className="border-t">
                    <td className="py-2">{r.month}</td>
                    <td className="py-2">{r.total}</td>
                    <td className="py-2">{r.retained}</td>
                    <td className="py-2">{r.retentionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="skeleton h-48 w-full rounded-lg" />
          )}
        </Section>
      </div>

      {/* Course performance */}
      <Section title="Course performance">
        {coursePerf.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Course</th>
                  <th className="py-2 font-medium">Enrollments</th>
                  <th className="py-2 font-medium">Completion</th>
                  <th className="py-2 font-medium">Avg progress</th>
                  <th className="py-2 font-medium">Rating</th>
                  <th className="py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {coursePerf.data.map((c) => (
                  <tr key={c.courseId} className="border-t">
                    <td className="max-w-[220px] truncate py-2" title={c.title}>
                      {c.title}
                    </td>
                    <td className="py-2">{c.enrollments}</td>
                    <td className="py-2">{c.completionRate}%</td>
                    <td className="py-2">{c.avgProgress}%</td>
                    <td className="py-2">{c.rating.toFixed(1)}</td>
                    <td className="py-2">{formatPrice(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="skeleton h-48 w-full rounded-lg" />
        )}
      </Section>

      {/* Instructor performance */}
      <Section title="Instructor performance">
        {instructorPerf.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Instructor</th>
                  <th className="py-2 font-medium">Courses</th>
                  <th className="py-2 font-medium">Students</th>
                  <th className="py-2 font-medium">Avg rating</th>
                  <th className="py-2 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {instructorPerf.data.map((r) => (
                  <tr key={r.instructorId} className="border-t">
                    <td className="py-2">
                      {r.name}
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="py-2">
                      {r.published}/{r.courses}
                    </td>
                    <td className="py-2">{r.students.toLocaleString('en-US')}</td>
                    <td className="py-2">{r.avgRating.toFixed(1)}</td>
                    <td className="py-2">{formatPrice(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="skeleton h-48 w-full rounded-lg" />
        )}
      </Section>
    </div>
  );
}
