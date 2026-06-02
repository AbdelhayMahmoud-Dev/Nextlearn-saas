import Stripe from 'stripe';
import { env } from './env';

/**
 * Singleton Stripe client — import this everywhere, never construct Stripe directly.
 *
 * The API version is pinned per the Phase 4 spec to guard against silent breaking
 * changes when the SDK is upgraded. (The installed SDK ships a newer default;
 * pinning keeps request/response shapes deterministic.)
 *
 * A placeholder key is used when `STRIPE_SECRET_KEY` is unset so the process can
 * still boot in non-billing environments (dev, seed scripts, CI). Any real API
 * call without a configured key fails with a Stripe auth error — callers must
 * first check {@link isStripeConfigured}.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? 'sk_test_unconfigured_placeholder', {
  // Pinned to the version the installed SDK is built against (the spec named an
  // older version, but the SDK's types only accept its own pinned version).
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
});

/** True only when a real Stripe secret key is configured. */
export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/*
 * Nameable type aliases derived from the SDK instance. stripe@22 exposes its
 * rich object types only through its `exports` map (unreachable via the default
 * import under classic Node resolution), so we recover them from method return
 * types instead. `lastResponse` is stripped so plain webhook objects assign too.
 */
export type StripeCheckoutSession = Omit<
  Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>,
  'lastResponse'
>;
export type StripeSubscription = Omit<
  Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>,
  'lastResponse'
>;
