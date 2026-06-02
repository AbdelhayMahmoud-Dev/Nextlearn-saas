'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import type { ApiResponse } from '@/types';

interface VerifyResult {
  mode: string;
  paid?: boolean;
  course: { id: string; title: string; slug: string; thumbnail: string | null } | null;
  enrollmentId: string | null;
}

function SuccessInner(): JSX.Element {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/dashboard');
      return;
    }
    let active = true;
    apiClient
      .get<ApiResponse<VerifyResult>>(
        `/payments/verify-session?sessionId=${encodeURIComponent(sessionId)}`,
      )
      .then((res) => {
        if (!active) return;
        setResult(res.data.data);
        setStatus('ok');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [sessionId, router]);

  useEffect(() => {
    if (status !== 'ok') return;
    void import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    });
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-primary" aria-label="Verifying payment" />
      </div>
    );
  }

  if (status === 'error' || !result) {
    return (
      <div className="container flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-heading text-2xl font-bold">We couldn&apos;t verify that payment</h1>
        <p className="text-muted-foreground">
          If you were charged, your access will appear shortly. Check your courses or contact support.
        </p>
        <Button asChild variant="brand">
          <Link href="/my-courses">View my courses</Link>
        </Button>
      </div>
    );
  }

  const isSubscription = result.mode === 'subscription';

  return (
    <div className="container flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-green-500/15 text-green-500">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="font-heading text-3xl font-bold">Payment successful!</h1>

      {isSubscription ? (
        <p className="text-muted-foreground">
          Your subscription is active. You now have full access to the catalog.
        </p>
      ) : result.course ? (
        <>
          {result.course.thumbnail && (
            <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border">
              <Image
                src={result.course.thumbnail}
                alt={result.course.title}
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover"
              />
            </div>
          )}
          <p className="text-lg">
            You&apos;re now enrolled in <span className="font-semibold">{result.course.title}</span>
          </p>
        </>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {isSubscription ? (
          <Button asChild variant="brand" size="lg">
            <Link href="/courses">Browse courses</Link>
          </Button>
        ) : result.course ? (
          <Button asChild variant="brand" size="lg">
            <Link href={`/courses/${result.course.slug}`}>Start learning →</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="lg">
          <Link href="/my-courses">View my courses</Link>
        </Button>
      </div>
    </div>
  );
}

/** Stripe Checkout success landing — verifies the session and confirms enrollment. */
export default function PaymentSuccessPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-brand-primary" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
