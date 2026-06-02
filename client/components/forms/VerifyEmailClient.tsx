'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type Status = 'verifying' | 'success' | 'error';

/** Calls the Express verify-email endpoint with the URL token and reports status. */
export function VerifyEmailClient(): JSX.Element {
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<Status>('verifying');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setStatus('error');
      return;
    }
    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2 className="size-10 animate-spin text-brand-primary" />
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-12 text-green-500" />
        <h1 className="font-heading text-xl font-semibold">Email verified</h1>
        <p className="text-sm text-muted-foreground">Your account is now active.</p>
        <Button asChild variant="brand" className="mt-2 w-full">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <XCircle className="size-12 text-destructive" />
      <h1 className="font-heading text-xl font-semibold">Verification failed</h1>
      <p className="text-sm text-muted-foreground">
        This link is invalid or has expired. Try signing in to request a new one.
      </p>
      <Button asChild variant="brand" className="mt-2 w-full">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
