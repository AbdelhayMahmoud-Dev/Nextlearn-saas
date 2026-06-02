import { Types } from 'mongoose';
import { stripe, isStripeConfigured } from '../config/stripe';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { Course } from '../models/Course.model';
import { User } from '../models/User.model';
import { Payment } from '../models/Payment.model';
import { Enrollment } from '../models/Enrollment.model';
import { Subscription } from '../models/Subscription.model';
import { Tenant } from '../models/Tenant.model';
import { TenantSettings } from '../models/TenantSettings.model';
import { CouponService } from './coupon.service';

/**
 * Resolves the tenant's active Stripe Connect destination + commission rate.
 * Returns `{ connectAccount: undefined }` when the tenant hasn't onboarded —
 * in which case the platform charges normally and keeps the full amount.
 */
async function getConnectContext(
  tenantId: string,
): Promise<{ connectAccount?: string; commissionRate: number }> {
  const [tenant, settings] = await Promise.all([
    Tenant.findById(tenantId).select('stripeAccountId stripeOnboardingComplete').lean(),
    TenantSettings.findOne({ tenantId }).select('commissionRate').lean(),
  ]);
  const commissionRate = settings?.commissionRate ?? 20;
  const connectAccount =
    tenant?.stripeAccountId && tenant.stripeOnboardingComplete ? tenant.stripeAccountId : undefined;
  return { connectAccount, commissionRate };
}

/** Guards every Stripe-touching method so unconfigured envs fail loudly, not silently. */
function assertStripe(): void {
  if (!isStripeConfigured()) {
    throw new ApiError(503, 'Payments are not configured on this server');
  }
}

export const PaymentService = {
  /**
   * Creates a Stripe Checkout session for a one-time course purchase.
   * The price is computed server-side (never trusted from the client); a coupon,
   * if supplied, is re-validated here before the session is created.
   */
  async createCheckoutSession(
    tenantId: string,
    userId: string,
    courseId: string,
    couponCode?: string,
    referralCode?: string,
  ): Promise<{ checkoutUrl: string }> {
    assertStripe();

    const course = await Course.findOne({ _id: courseId, tenantId, isPublished: true })
      .select('title shortDescription thumbnail price salePrice currency')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');
    if (course.price <= 0) {
      throw ApiError.badRequest('This is a free course — use free enrollment instead');
    }

    const existing = await Enrollment.findOne({ tenantId, userId, courseId, status: 'active' }).lean();
    if (existing) throw ApiError.conflict('You are already enrolled in this course');

    const user = await User.findOne({ _id: userId, tenantId }).select('email').lean();
    if (!user) throw ApiError.notFound('User not found');

    // Effective price = sale price when it's actually lower (server-authoritative).
    const effectivePrice =
      course.salePrice !== undefined && course.salePrice < course.price
        ? course.salePrice
        : course.price;

    // Server-side price resolution (cents) — coupons stack on the effective price.
    let amountCents = Math.round(effectivePrice * 100);
    let couponId: string | undefined;
    if (couponCode) {
      const result = await CouponService.validateCoupon(tenantId, couponCode, courseId, effectivePrice);
      amountCents = Math.round(result.discount.finalPrice * 100);
      couponId = result.couponId;
    }
    const currency = (course.currency || 'USD').toLowerCase();

    const metadata: Record<string, string> = { tenantId, userId, courseId };
    if (couponId) metadata.couponId = couponId;
    if (referralCode) metadata.referralCode = referralCode;

    // Stripe Connect: route the tenant's share to their account, keep the fee.
    const { connectAccount, commissionRate } = await getConnectContext(tenantId);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: course.title,
              ...(course.shortDescription ? { description: course.shortDescription } : {}),
              ...(course.thumbnail ? { images: [course.thumbnail] } : {}),
            },
          },
        },
      ],
      metadata,
      ...(connectAccount
        ? {
            payment_intent_data: {
              application_fee_amount: Math.round(amountCents * (commissionRate / 100)),
              transfer_data: { destination: connectAccount },
            },
          }
        : {}),
      success_url: `${env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.STRIPE_CANCEL_URL,
    });

    if (!session.url) throw new ApiError(502, 'Stripe did not return a checkout URL');

    await Payment.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      stripeSessionId: session.id,
      amount: amountCents,
      currency: currency.toUpperCase(),
      status: 'pending',
      type: 'one-time',
      metadata: couponId ? { couponId } : {},
    });

    return { checkoutUrl: session.url };
  },

  /**
   * Creates a Stripe Checkout session for a platform subscription.
   */
  async createSubscriptionSession(
    tenantId: string,
    userId: string,
    plan: 'monthly' | 'annual',
  ): Promise<{ checkoutUrl: string }> {
    assertStripe();

    const priceId = plan === 'monthly' ? env.STRIPE_MONTHLY_PRICE_ID : env.STRIPE_ANNUAL_PRICE_ID;
    if (!priceId) throw new ApiError(503, `No Stripe price configured for the ${plan} plan`);

    const active = await Subscription.findOne({
      tenantId,
      userId,
      status: { $in: ['active', 'trialing', 'past_due'] },
    }).lean();
    if (active) throw ApiError.conflict('You already have an active subscription');

    const user = await User.findOne({ _id: userId, tenantId }).select('email').lean();
    if (!user) throw ApiError.notFound('User not found');

    const { connectAccount, commissionRate } = await getConnectContext(tenantId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { tenantId, userId, plan },
      subscription_data: {
        metadata: { tenantId, userId, plan },
        ...(connectAccount
          ? {
              application_fee_percent: commissionRate,
              transfer_data: { destination: connectAccount },
            }
          : {}),
      },
      success_url: `${env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: env.STRIPE_CANCEL_URL,
    });

    if (!session.url) throw new ApiError(502, 'Stripe did not return a checkout URL');

    await Payment.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      stripeSessionId: session.id,
      amount: 0,
      currency: 'USD',
      status: 'pending',
      type: 'subscription',
      metadata: { plan },
    });

    return { checkoutUrl: session.url };
  },

  /** Opens the Stripe Customer Portal for managing/cancelling a subscription. */
  async createBillingPortalSession(
    tenantId: string,
    userId: string,
  ): Promise<{ portalUrl: string }> {
    assertStripe();

    const subscription = await Subscription.findOne({ tenantId, userId })
      .sort({ createdAt: -1 })
      .select('stripeCustomerId')
      .lean();
    if (!subscription?.stripeCustomerId) {
      throw ApiError.badRequest('No billing account found for this user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.CLIENT_URL}/subscription`,
    });

    return { portalUrl: session.url };
  },

  /** Paginated payment history for a user (newest first). */
  async getPaymentHistory(
    tenantId: string,
    userId: string,
    query: { page?: unknown; limit?: unknown },
  ) {
    const { page, limit, skip } = getPagination(query, 50);
    const [items, total] = await Promise.all([
      Payment.find({ tenantId, userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments({ tenantId, userId }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Current subscription for a user (active first, else most recent). */
  async getSubscription(tenantId: string, userId: string) {
    const active = await Subscription.findOne({
      tenantId,
      userId,
      status: { $in: ['active', 'trialing', 'past_due'] },
    })
      .sort({ createdAt: -1 })
      .lean();
    if (active) return active;
    return Subscription.findOne({ tenantId, userId }).sort({ createdAt: -1 }).lean();
  },

  /**
   * Marks a checkout session's Payment as completed (webhook).
   * Returns the payment id ONLY on the first pending→completed transition, so
   * retried events don't trigger duplicate side-effects (enrollment, coupon use).
   * Returns null if the payment is missing or was already completed.
   */
  async markSessionCompleted(
    sessionId: string,
    data: { paymentIntentId?: string },
  ): Promise<{ paymentId: string } | null> {
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    if (!payment || payment.status === 'completed') return null;
    payment.status = 'completed';
    if (data.paymentIntentId) payment.stripePaymentIntentId = data.paymentIntentId;
    await payment.save();
    return { paymentId: payment._id.toString() };
  },

  /**
   * Marks a Payment refunded by its payment-intent id (webhook). Idempotent.
   * Returns the affected payment's id, or null.
   */
  async markRefundedByIntent(
    paymentIntentId: string,
    receiptUrl?: string,
  ): Promise<{ paymentId: string } | null> {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) return null;
    if (payment.status !== 'refunded') {
      payment.status = 'refunded';
      if (receiptUrl) payment.stripeReceiptUrl = receiptUrl;
      await payment.save();
    }
    return { paymentId: payment._id.toString() };
  },

  /**
   * Verifies a completed checkout session for the success page.
   * Returns lightweight course + enrollment info for the confirmation screen.
   */
  async verifySession(tenantId: string, userId: string, sessionId: string) {
    assertStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
    if (!session) throw ApiError.notFound('Checkout session not found');

    // Defense-in-depth: the session must belong to this tenant + user.
    if (session.metadata?.tenantId !== tenantId || session.metadata?.userId !== userId) {
      throw ApiError.forbidden('This checkout session does not belong to you');
    }

    const courseId = session.metadata?.courseId;
    if (!courseId) {
      return { mode: session.mode, course: null, enrollmentId: null };
    }

    const [course, enrollment] = await Promise.all([
      Course.findOne({ _id: courseId, tenantId })
        .select('title slug thumbnail')
        .lean(),
      Enrollment.findOne({ tenantId, userId, courseId }).select('_id').lean(),
    ]);

    return {
      mode: session.mode,
      paid: session.payment_status === 'paid',
      course: course
        ? {
            id: course._id.toString(),
            title: course.title,
            slug: course.slug,
            thumbnail: course.thumbnail ?? null,
          }
        : null,
      enrollmentId: enrollment?._id.toString() ?? null,
    };
  },

  /**
   * Admin-initiated refund. Refunds via Stripe, marks the Payment refunded, and
   * revokes the related enrollment. Server-side only — never callable by clients.
   */
  async adminRefund(tenantId: string, paymentId: string, reason?: string): Promise<void> {
    assertStripe();

    const payment = await Payment.findOne({ _id: paymentId, tenantId });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status !== 'completed') {
      throw ApiError.badRequest('Only completed payments can be refunded');
    }
    if (!payment.stripePaymentIntentId) {
      throw ApiError.badRequest('This payment has no Stripe payment intent to refund');
    }

    await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      ...(reason ? { metadata: { reason } } : {}),
    });

    payment.status = 'refunded';
    await payment.save();

    // Lazy import avoids a service import cycle.
    const { EnrollmentService } = await import('./enrollment.service');
    await EnrollmentService.refundEnrollment(payment._id.toString());
  },
};
