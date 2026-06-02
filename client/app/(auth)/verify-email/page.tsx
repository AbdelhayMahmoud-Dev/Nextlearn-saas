import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { VerifyEmailClient } from '@/components/forms/VerifyEmailClient';

export const metadata: Metadata = { title: 'Verify email' };

export default function VerifyEmailPage(): JSX.Element {
  return (
    <Card>
      <CardContent className="py-8">
        <Suspense fallback={null}>
          <VerifyEmailClient />
        </Suspense>
      </CardContent>
    </Card>
  );
}
