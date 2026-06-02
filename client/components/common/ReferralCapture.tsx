'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { storeReferralCode } from '@/lib/referral';

/**
 * Captures `?ref=CODE` on any page load: persists it for attribution and
 * best-effort logs the click server-side. Renders nothing.
 */
export function ReferralCapture(): null {
  const params = useSearchParams();
  const ref = params.get('ref');

  useEffect(() => {
    if (!ref) return;
    storeReferralCode(ref);
    // Best-effort click tracking; failures are non-fatal.
    apiClient.post('/affiliate/track', { code: ref }).catch(() => undefined);
  }, [ref]);

  return null;
}
