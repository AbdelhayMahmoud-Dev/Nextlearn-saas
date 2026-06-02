'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Loader2, ShieldCheck } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import {
  useCreateCheckout,
  useCreateSubscription,
  useEnrollFree,
  useValidateCoupon,
} from '@/hooks/useSubscription';
import type { CouponValidationResult, ICourse } from '@/types';

interface CourseEnrollCardProps {
  course: Pick<ICourse, '_id' | 'slug' | 'price' | 'salePrice' | 'currency'>;
  isEnrolled?: boolean;
  /** First lesson, used to deep-link into the player after free enrollment. */
  firstLessonId?: string;
}

/** Pricing + coupon + enroll/subscribe card for the course detail page. */
export function CourseEnrollCard({
  course,
  isEnrolled,
  firstLessonId,
}: CourseEnrollCardProps): JSX.Element {
  const router = useRouter();
  const isAuthed = useAuthStore((s) => Boolean(s.user));
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<CouponValidationResult | null>(null);

  const validateCoupon = useValidateCoupon();
  const checkout = useCreateCheckout();
  const subscribe = useCreateSubscription();
  const enrollFree = useEnrollFree();

  const isFree = course.price === 0;
  const onSale = course.salePrice !== undefined && course.salePrice < course.price;
  const base = onSale ? (course.salePrice as number) : course.price;
  const finalPrice = applied ? applied.discount.finalPrice : base;
  const loginHref = `/login?callbackUrl=/courses/${course.slug}`;

  const handleApply = (): void => {
    validateCoupon.mutate(
      { code: code.trim(), courseId: course._id },
      { onSuccess: (res) => setApplied(res) },
    );
  };

  const handleEnrollFree = (): void => {
    enrollFree.mutate(course._id, {
      onSuccess: () =>
        router.push(firstLessonId ? `/learn/${course._id}/${firstLessonId}` : '/my-courses'),
    });
  };

  if (isEnrolled) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="font-heading text-lg font-semibold">You&apos;re enrolled</p>
        <Button asChild variant="brand" className="mt-4 w-full">
          <Link href={firstLessonId ? `/learn/${course._id}/${firstLessonId}` : '/my-courses'}>
            Go to course
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold">
          {isFree ? 'Free' : formatPrice(finalPrice, course.currency)}
        </span>
        {!isFree && (onSale || applied) && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(course.price, course.currency)}
          </span>
        )}
      </div>

      {!isFree && (
        <>
          {/* Coupon */}
          <div className="mt-4 flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter coupon code"
              aria-label="Coupon code"
              disabled={Boolean(applied)}
            />
            <Button
              variant="outline"
              onClick={handleApply}
              disabled={!code.trim() || validateCoupon.isPending || Boolean(applied)}
            >
              {validateCoupon.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {applied && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-green-500">
              <BadgeCheck className="size-4" />
              Coupon &ldquo;{applied.code}&rdquo; applied — save{' '}
              {formatPrice(applied.discount.savings, course.currency)}
            </p>
          )}
          {validateCoupon.isError && (
            <p className="mt-2 text-sm text-red-500">{validateCoupon.error.message}</p>
          )}
        </>
      )}

      {/* Primary CTA */}
      <div className="mt-5 space-y-3">
        {isFree ? (
          isAuthed ? (
            <Button variant="brand" className="w-full" onClick={handleEnrollFree} disabled={enrollFree.isPending}>
              {enrollFree.isPending && <Loader2 className="size-4 animate-spin" />}
              Enroll free
            </Button>
          ) : (
            <Button asChild variant="brand" className="w-full">
              <Link href={loginHref}>Sign in to enroll</Link>
            </Button>
          )
        ) : isAuthed ? (
          <>
            <Button
              variant="brand"
              className="w-full"
              onClick={() => checkout.mutate({ courseId: course._id, couponCode: applied?.code })}
              disabled={checkout.isPending}
            >
              {checkout.isPending && <Loader2 className="size-4 animate-spin" />}
              Enroll now — {formatPrice(finalPrice, course.currency)}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => subscribe.mutate('monthly')}
              disabled={subscribe.isPending}
            >
              {subscribe.isPending && <Loader2 className="size-4 animate-spin" />}
              Subscribe for $29/mo
            </Button>
          </>
        ) : (
          <Button asChild variant="brand" className="w-full">
            <Link href={loginHref}>Sign in to enroll</Link>
          </Button>
        )}
        {(checkout.isError || subscribe.isError || enrollFree.isError) && (
          <p className="text-sm text-red-500">
            {(checkout.error ?? subscribe.error ?? enrollFree.error)?.message}
          </p>
        )}
      </div>

      <p className={cn('mt-4 flex items-center gap-1.5 text-xs text-muted-foreground')}>
        <ShieldCheck className="size-4" /> 30-day money-back guarantee
      </p>
    </div>
  );
}
