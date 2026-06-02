import { Types } from 'mongoose';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/Subscription.model';
import { env } from '../config/env';
import type { StripeSubscription } from '../config/stripe';
import { NotificationService } from './notification.service';

/** Derives our plan enum from the Stripe price id (falls back to metadata). */
function resolvePlan(sub: StripeSubscription): SubscriptionPlan {
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && priceId === env.STRIPE_ANNUAL_PRICE_ID) return 'annual';
  if (priceId && priceId === env.STRIPE_MONTHLY_PRICE_ID) return 'monthly';
  return sub.metadata?.plan === 'annual' ? 'annual' : 'monthly';
}

export const SubscriptionService = {
  /**
   * Upserts a Subscription document from a Stripe subscription object
   * (handles customer.subscription.created / updated). Idempotent.
   */
  async upsertFromStripe(sub: StripeSubscription): Promise<void> {
    const tenantId = sub.metadata?.tenantId;
    const userId = sub.metadata?.userId;
    if (!tenantId || !userId) return; // not one of ours

    // In the pinned API version the billing period lives on each item.
    const periodEnd = sub.items.data[0]?.current_period_end;

    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      {
        $set: {
          tenantId: new Types.ObjectId(tenantId),
          userId: new Types.ObjectId(userId),
          stripeSubscriptionId: sub.id,
          stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          plan: resolvePlan(sub),
          status: sub.status as SubscriptionStatus,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  },

  /** Marks a subscription canceled and notifies the user. */
  async markCanceled(sub: StripeSubscription): Promise<void> {
    const doc = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { $set: { status: 'canceled', cancelAtPeriodEnd: false } },
      { new: true },
    ).lean();
    if (doc) {
      await NotificationService.create(doc.tenantId.toString(), doc.userId.toString(), {
        type: 'payment',
        title: 'Your subscription has ended',
        body: 'Your subscription is now canceled. Resubscribe anytime to regain full access.',
        link: '/subscription',
      });
    }
  },

  /** Marks a subscription past_due on a failed invoice and notifies the user. */
  async markPastDueByCustomer(customerId: string): Promise<void> {
    const doc = await Subscription.findOneAndUpdate(
      { stripeCustomerId: customerId },
      { $set: { status: 'past_due' } },
      { new: true },
    ).lean();
    if (doc) {
      await NotificationService.create(doc.tenantId.toString(), doc.userId.toString(), {
        type: 'payment',
        title: 'Payment failed',
        body: 'We could not process your subscription payment. Please update your billing info.',
        link: '/billing',
      });
    }
  },
};
