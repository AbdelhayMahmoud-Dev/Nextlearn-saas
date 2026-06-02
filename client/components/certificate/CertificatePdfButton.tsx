'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateTemplate } from './CertificateTemplate';

interface CertificatePdfButtonProps {
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  certificateNumber: string;
  qrDataUrl?: string;
}

/**
 * Client-only PDF download button. Loaded via `dynamic(..., { ssr: false })`
 * so the ESM-only @react-pdf/renderer never enters the server render graph.
 */
export default function CertificatePdfButton(props: CertificatePdfButtonProps): JSX.Element {
  return (
    <PDFDownloadLink
      document={<CertificateTemplate {...props} />}
      fileName={`nextlearn-certificate-${props.certificateNumber}.pdf`}
    >
      {({ loading }: { loading: boolean }) => (
        <Button variant="brand" size="sm" disabled={loading}>
          <Download className="size-4" /> {loading ? 'Preparing…' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
