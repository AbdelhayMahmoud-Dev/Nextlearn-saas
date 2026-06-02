import { User } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { EmailService } from '../services/email.service';
import { logger } from '../utils/logger';

/**
 * Sends a weekly learning-progress digest to active students who have at least
 * one in-progress (under 100%) enrollment. Batched to bound memory on large
 * tenants; individual send failures don't abort the run.
 */
export async function weeklyDigestJob(): Promise<void> {
  const BATCH = 50;
  let skip = 0;
  let total = 0;

  for (;;) {
    const users = await User.find({ role: 'student', isActive: true })
      .select('_id tenantId name email')
      .skip(skip)
      .limit(BATCH)
      .lean();
    if (users.length === 0) break;

    await Promise.allSettled(
      users.map(async (u) => {
        const active = await Enrollment.countDocuments({
          userId: u._id,
          tenantId: u.tenantId,
          status: 'active',
          'progress.percentage': { $lt: 100 },
        });
        if (active === 0) return;
        await EmailService.sendWeeklyDigest(u.email, u.name, active);
      }),
    );

    total += users.length;
    skip += BATCH;
    if (users.length < BATCH) break;
  }

  logger.info({ usersProcessed: total }, 'weeklyDigest: job complete');
}
