import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ShieldX } from 'lucide-react';
import { serverGet } from '@/lib/server-api';
import type { ApiResponse } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VerifyResult {
  valid: boolean;
  certificateNumber?: string;
  studentName?: string;
  courseTitle?: string;
  issuedAt?: string;
}

export const metadata: Metadata = {
  title: 'Verify certificate',
  description: 'Verify the authenticity of a NextLearn certificate.',
};

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: { certificateNumber: string };
}): Promise<JSX.Element> {
  let result: VerifyResult = { valid: false };
  try {
    const res = await serverGet<ApiResponse<VerifyResult>>(
      `/certificates/verify/${params.certificateNumber}`,
      { revalidate: 0 },
    );
    result = res.data;
  } catch {
    result = { valid: false };
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
        {result.valid ? (
          <>
            <CheckCircle2 className="mx-auto size-14 text-green-500" />
            <h1 className="mt-4 font-heading text-2xl font-semibold">Valid certificate</h1>
            <dl className="mt-6 space-y-3 text-left text-sm">
              <Row label="Student" value={result.studentName ?? '—'} />
              <Row label="Course" value={result.courseTitle ?? '—'} />
              <Row label="Issued" value={result.issuedAt ? formatDate(result.issuedAt) : '—'} />
              <Row label="Certificate №" value={result.certificateNumber ?? '—'} />
            </dl>
            <p className="mt-6 text-xs text-muted-foreground">Issued by NextLearn</p>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto size-14 text-destructive" />
            <h1 className="mt-4 font-heading text-2xl font-semibold">Certificate not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t verify this certificate number. Please check the link and try again.
            </p>
            <Button asChild variant="brand" className="mt-6">
              <Link href="/">Go home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
