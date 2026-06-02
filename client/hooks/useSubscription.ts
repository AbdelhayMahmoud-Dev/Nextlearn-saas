'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { clearReferralCode, getReferralCode } from '@/lib/referral';
import type {
  ApiErrorShape,
  ApiResponse,
  CouponValidationResult,
  IEnrollment,
  ISubscription,
} from '@/types';

/** Current subscription for the signed-in user (null when none). */
export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<ISubscription | null> =>
      (await apiClient.get<ApiResponse<ISubscription | null>>('/payments/subscription')).data.data,
    staleTime: 2 * 60 * 1000,
  });
}

/** Creates a one-time course checkout session and redirects to Stripe. */
export function useCreateCheckout() {
  return useMutation<string, ApiErrorShape, { courseId: string; couponCode?: string }>({
    mutationFn: async ({ courseId, couponCode }): Promise<string> => {
      const { data } = await apiClient.post<ApiResponse<{ checkoutUrl: string }>>(
        '/payments/checkout',
        { courseId, couponCode, referralCode: getReferralCode() },
      );
      return data.data.checkoutUrl;
    },
    onSuccess: (checkoutUrl) => {
      window.location.href = checkoutUrl;
    },
  });
}

/** Creates a subscription checkout session and redirects to Stripe. */
export function useCreateSubscription() {
  return useMutation<string, ApiErrorShape, 'monthly' | 'annual'>({
    mutationFn: async (plan): Promise<string> => {
      const { data } = await apiClient.post<ApiResponse<{ checkoutUrl: string }>>(
        '/payments/subscribe',
        { plan },
      );
      return data.data.checkoutUrl;
    },
    onSuccess: (checkoutUrl) => {
      window.location.href = checkoutUrl;
    },
  });
}

/** Opens the Stripe Customer Portal (same-tab redirect). */
export function useOpenBillingPortal() {
  return useMutation<string, ApiErrorShape, void>({
    mutationFn: async (): Promise<string> => {
      const { data } = await apiClient.get<ApiResponse<{ portalUrl: string }>>('/payments/portal');
      return data.data.portalUrl;
    },
    onSuccess: (portalUrl) => {
      window.location.href = portalUrl;
    },
  });
}

/** Validates a coupon against a course (no usage increment). */
export function useValidateCoupon() {
  return useMutation<CouponValidationResult, ApiErrorShape, { code: string; courseId: string }>({
    mutationFn: async ({ code, courseId }): Promise<CouponValidationResult> => {
      const { data } = await apiClient.post<ApiResponse<CouponValidationResult>>(
        '/coupons/validate',
        { code, courseId },
      );
      return data.data;
    },
  });
}

/** Enrolls in a free course (no payment). */
export function useEnrollFree() {
  const queryClient = useQueryClient();
  return useMutation<IEnrollment, ApiErrorShape, string>({
    mutationFn: async (courseId): Promise<IEnrollment> => {
      const { data } = await apiClient.post<ApiResponse<IEnrollment>>('/enrollments/free', {
        courseId,
        referralCode: getReferralCode(),
      });
      return data.data;
    },
    onSuccess: () => {
      clearReferralCode();
      void queryClient.invalidateQueries({ queryKey: ['enrollments', 'my'] });
    },
  });
}
