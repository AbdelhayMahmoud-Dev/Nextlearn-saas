import { stripe, isStripeConfigured } from '../config/stripe';
import { Tenant } from '../models/Tenant.model';
import { ApiError } from '../utils/ApiError';

function assertStripe(): void {
  if (!isStripeConfigured()) throw new ApiError(503, 'Payments are not configured on this server');
}

export const StripeConnectService = {
  /** Creates a Stripe Connect Express account for a tenant (idempotent). */
  async createConnectAccount(tenantId: string, email: string): Promise<{ accountId: string }> {
    assertStripe();
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw ApiError.notFound('Tenant not found');
    if (tenant.stripeAccountId) return { accountId: tenant.stripeAccountId };

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { tenantId },
    });

    tenant.stripeAccountId = account.id;
    tenant.stripeAccountStatus = 'pending';
    tenant.stripeOnboardingComplete = false;
    await tenant.save();
    return { accountId: account.id };
  },

  /** Creates a one-time onboarding link for completing Stripe verification. */
  async createOnboardingLink(
    tenantId: string,
    returnUrl: string,
    refreshUrl: string,
  ): Promise<{ url: string }> {
    assertStripe();
    const tenant = await Tenant.findById(tenantId).select('stripeAccountId').lean();
    if (!tenant?.stripeAccountId) throw ApiError.badRequest('No Stripe account — create one first');

    const link = await stripe.accountLinks.create({
      account: tenant.stripeAccountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
    return { url: link.url };
  },

  /** Creates a login link to the tenant's Stripe Express dashboard. */
  async createLoginLink(tenantId: string): Promise<{ url: string }> {
    assertStripe();
    const tenant = await Tenant.findById(tenantId).select('stripeAccountId stripeOnboardingComplete').lean();
    if (!tenant?.stripeAccountId) throw ApiError.badRequest('No Stripe account connected');
    if (!tenant.stripeOnboardingComplete) {
      throw ApiError.badRequest('Complete Stripe onboarding before accessing the dashboard');
    }
    const link = await stripe.accounts.createLoginLink(tenant.stripeAccountId);
    return { url: link.url };
  },

  /** Syncs the Connect account status from Stripe onto the Tenant doc. */
  async syncAccountStatus(tenantId: string): Promise<{
    stripeAccountId: string | null;
    stripeAccountStatus: string | null;
    stripeOnboardingComplete: boolean;
  }> {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw ApiError.notFound('Tenant not found');
    if (!tenant.stripeAccountId) {
      return { stripeAccountId: null, stripeAccountStatus: null, stripeOnboardingComplete: false };
    }
    assertStripe();

    const account = await stripe.accounts.retrieve(tenant.stripeAccountId);
    const complete = Boolean(account.details_submitted && account.charges_enabled && account.payouts_enabled);
    tenant.stripeOnboardingComplete = complete;
    tenant.stripeAccountStatus = complete
      ? 'active'
      : account.requirements?.disabled_reason
        ? 'restricted'
        : 'pending';
    await tenant.save();

    return {
      stripeAccountId: tenant.stripeAccountId,
      stripeAccountStatus: tenant.stripeAccountStatus,
      stripeOnboardingComplete: complete,
    };
  },

  /** Splits an amount (cents) into platform fee + tenant payout by commission %. */
  getFeeSplit(amountCents: number, commissionRate: number): { platformFee: number; tenantPayout: number } {
    const platformFee = Math.round(amountCents * (commissionRate / 100));
    return { platformFee, tenantPayout: amountCents - platformFee };
  },
};
