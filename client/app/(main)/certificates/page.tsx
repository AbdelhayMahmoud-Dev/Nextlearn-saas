'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateCertificate, useMyCertificates } from '@/hooks/useCertificates';
import { useMyCourses } from '@/hooks/useEnrollment';
import { CertificateCard } from '@/components/certificate/CertificateCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';

function Skeletons(): JSX.Element {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <div className="skeleton aspect-video" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-8 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CertificatesPage(): JSX.Element {
  const { data: session } = useSession();
  const studentName = session?.user?.name ?? 'Student';
  const certs = useMyCertificates();
  const courses = useMyCourses();
  const generate = useGenerateCertificate();

  const issued = certs.data ?? [];
  const issuedCourseIds = new Set(issued.map((c) => c.courseId));
  const claimable = (courses.data ?? []).filter(
    (e) => e.progress.percentage >= 100 && !issuedCourseIds.has(e.courseId),
  );

  const onClaim = (courseId: string): void => {
    generate.mutate(courseId, {
      onSuccess: () => toast.success('Certificate issued! 🎓'),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="container py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Certificates</h1>
      <p className="mt-1 text-muted-foreground">Your earned certificates of completion.</p>

      {claimable.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-heading text-lg font-semibold">Ready to claim</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {claimable.map((enrollment) => (
              <div
                key={enrollment._id}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{enrollment.course?.title ?? 'Course'}</p>
                  <p className="text-xs text-muted-foreground">Course completed</p>
                </div>
                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => onClaim(enrollment.courseId)}
                  disabled={generate.isPending}
                >
                  {generate.isPending && <Loader2 className="size-4 animate-spin" />} Claim
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        {certs.isLoading ? (
          <Skeletons />
        ) : certs.isError ? (
          <ErrorState title="Couldn't load your certificates" onRetry={() => void certs.refetch()} />
        ) : issued.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Complete a course to earn your first certificate."
            action={
              <Button asChild variant="brand">
                <Link href="/my-courses">Go to my courses</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {issued.map((certificate) => (
              <CertificateCard key={certificate._id} certificate={certificate} studentName={studentName} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
