'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import type { ICertificate } from '@/types';
import { Button } from '@/components/ui/button';

// Isolate the ESM-only PDF renderer behind a no-SSR dynamic boundary.
const CertificatePdfButton = dynamic(() => import('./CertificatePdfButton'), {
  ssr: false,
  loading: () => (
    <Button variant="brand" size="sm" disabled>
      Preparing…
    </Button>
  ),
});

interface CertificateActionsProps {
  certificate: ICertificate;
  studentName: string;
}

/** Download (PDF), copy verify link, and share actions for a certificate. */
export function CertificateActions({ certificate, studentName }: CertificateActionsProps): JSX.Element {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const verifyUrl = `${appUrl}/verify/${certificate.certificateNumber}`;
  const [qr, setQr] = useState<string | undefined>(undefined);

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 })
      .then(setQr)
      .catch(() => setQr(undefined));
  }, [verifyUrl]);

  const copyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(verifyUrl);
    toast.success('Verification link copied');
  };

  const shareLinkedIn = (): void => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`,
      '_blank',
      'noopener',
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <CertificatePdfButton
        studentName={studentName}
        courseTitle={certificate.course?.title ?? 'Course'}
        issuedAt={certificate.issuedAt}
        certificateNumber={certificate.certificateNumber}
        qrDataUrl={qr}
      />
      <Button variant="outline" size="sm" onClick={copyLink}>
        <Copy className="size-4" /> Copy link
      </Button>
      <Button variant="outline" size="sm" onClick={shareLinkedIn}>
        <Linkedin className="size-4" /> Share
      </Button>
    </div>
  );
}
