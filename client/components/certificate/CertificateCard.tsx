'use client';

import Image from 'next/image';
import { Award } from 'lucide-react';
import type { ICertificate } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { CertificateActions } from './CertificateActions';

/** Issued-certificate card with download / verify / share actions. */
export function CertificateCard({
  certificate,
  studentName,
}: {
  certificate: ICertificate;
  studentName: string;
}): JSX.Element {
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-video bg-muted">
        {certificate.course?.thumbnail && (
          <Image
            src={certificate.course.thumbnail}
            alt={certificate.course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-primary px-2.5 py-1 text-xs font-medium text-brand-primary-foreground">
          <Award className="size-3.5" /> Certified
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-heading font-semibold">
          {certificate.course?.title ?? 'Course'}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Issued {formatDate(certificate.issuedAt)} · #{truncate(certificate.certificateNumber, 10)}
        </p>
        <div className="mt-4">
          <CertificateActions certificate={certificate} studentName={studentName} />
        </div>
      </div>
    </article>
  );
}
