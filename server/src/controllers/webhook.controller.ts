import type { Request, Response } from 'express';
import { stripe, isStripeConfigured } from '../config/stripe';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { PaymentService } from '../services/payment.service';
import { EnrollmentService } from '../services/enrollment.service';
import { CouponService } from '../services/coupon.service';
import { SubscriptionService } from '../services/subscription.service';

/** Narrows a Stripe expandable field to its id string. */
function idOf(field: string | { id: string } | null | undefined): string | undefined {
  if (!field) return undefined;
  return typeof field === 'string' ? field : field.id;
}

export const WebhookController = {
  /**
   * Stripe webhook endpoint. Requires the RAW request body (mounted before
   * express.json() in app.ts) so the signature can be verified. All handlers are
   * idempotent — Stripe may deliver an event more than once.
   */
  handleStripe: asyncHandler(async (req: Request, res: Response) => {
    if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
      throw new ApiError(503, 'Stripe webhooks are not configured');
    }

    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') throw ApiError.badRequest('Missing Stripe signature');

    let event;
    try {
      // req.body is a Buffer here (express.raw). constructEvent verifies the HMAC.
      event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      throw ApiError.badRequest('Invalid webhook signature');
    }

    // The `object` discriminant narrows the event object to a concrete type
    // without naming the (resolution-blocked) Stripe.* namespace types.
    const obj = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        if (obj.object !== 'checkout.session') break;
        const { tenantId, userId, courseId, couponId } = obj.metadata ?? {};

        if (obj.mode === 'payment' && tenantId && userId && courseId) {
          const completed = await PaymentService.markSessionCompleted(obj.id, {
            paymentIntentId: idOf(obj.payment_intent),
          });
          // Side-effects run only on the first completion (idempotency).
          if (completed) {
            await EnrollmentService.createEnrollment(tenantId, userId, courseId, completed.paymentId);
            if (couponId) await CouponService.applyCoupon(couponId);
          }
        } else if (obj.mode === 'subscription') {
          await PaymentService.markSessionCompleted(obj.id, {});
          // The Subscription doc itself is created via subscription.* events.
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        if (obj.object === 'subscription') await SubscriptionService.upsertFromStripe(obj);
        break;
      }

      case 'customer.subscription.deleted': {
        if (obj.object === 'subscription') await SubscriptionService.markCanceled(obj);
        break;
      }

      case 'invoice.payment_failed': {
        if (obj.object !== 'invoice') break;
        const customerId = idOf(obj.customer);
        if (customerId) await SubscriptionService.markPastDueByCustomer(customerId);
        break;
      }

      case 'charge.refunded': {
        if (obj.object !== 'charge') break;
        const paymentIntentId = idOf(obj.payment_intent);
        if (paymentIntentId) {
          const refunded = await PaymentService.markRefundedByIntent(
            paymentIntentId,
            obj.receipt_url ?? undefined,
          );
          if (refunded) await EnrollmentService.refundEnrollment(refunded.paymentId);
        }
        break;
      }

      default:
        logger.debug({ type: event.type }, 'Unhandled Stripe webhook event');
    }

    // Always acknowledge so Stripe stops retrying a successfully-processed event.
    ApiResponse.success(res, null, 'Webhook processed');
  }),
};
