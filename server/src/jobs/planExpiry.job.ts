import { Tenant } from '../models/Tenant.model';
import { logger } from '../utils/logger';

/**
 * Downgrades tenants whose paid plan has passed its expiry date back to 'free'.
 * (Plans + expiry are set by a superadmin.) Idempotent.
 */
export async function planExpiryJob(): Promise<void> {
  const now = new Date();
  const result = await Tenant.updateMany(
    { plan: { $ne: 'free' }, planExpiresAt: { $lt: now } },
    { $set: { plan: 'free' }, $unset: { planExpiresAt: '' } },
  );
  if (result.modifiedCount > 0) {
    logger.info({ count: result.modifiedCount }, 'planExpiry: tenants downgraded to free');
  }
}
