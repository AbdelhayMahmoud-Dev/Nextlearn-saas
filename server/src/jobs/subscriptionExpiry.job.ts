import { Subscription } from '../models/Subscription.model';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

/**
 * Marks active, cancel-at-period-end subscriptions past their period end as
 * 'expired' and notifies the user. Idempotent — already-expired subscriptions
 * are not re-selected.
 */
export async function subscriptionExpiryJob(): Promise<void> {
  const now = new Date();
  const expired = await Subscription.find({
    status: 'active',
    currentPeriodEnd: { $lt: now },
    cancelAtPeriodEnd: true,
  })
    .select('_id tenantId userId')
    .lean();

  if (expired.length === 0) return;

  await Subscription.updateMany(
    { _id: { $in: expired.map((s) => s._id) } },
    { $set: { status: 'expired' } },
  );

  await Promise.allSettled(
    expired.map((s) =>
      NotificationService.create(s.tenantId.toString(), s.userId.toString(), {
        type: 'subscription',
        title: 'Subscription ended',
        body: 'Your subscription has ended. Renew to keep accessing all courses.',
        link: '/subscription',
      }),
    ),
  );

  logger.info({ count: expired.length }, 'subscriptionExpiry: expired subscriptions processed');
}
