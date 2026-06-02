import cron from 'node-cron';
import { logger } from '../utils/logger';
import { subscriptionExpiryJob } from './subscriptionExpiry.job';
import { weeklyDigestJob } from './weeklyDigest.job';
import { planExpiryJob } from './planExpiry.job';

/**
 * Registers all cron jobs. Call once at startup (after the DB connects).
 * Each tick catches its own errors so a failing job never crashes the server.
 */
export function registerJobs(): void {
  // Expired subscriptions — every hour.
  cron.schedule('0 * * * *', () => {
    logger.info('Running: subscriptionExpiry');
    void subscriptionExpiryJob().catch((e) => logger.error({ err: e }, 'subscriptionExpiry job failed'));
  });

  // Weekly learning digest — Mondays at 09:00 UTC.
  cron.schedule('0 9 * * 1', () => {
    logger.info('Running: weeklyDigest');
    void weeklyDigestJob().catch((e) => logger.error({ err: e }, 'weeklyDigest job failed'));
  });

  // Tenant plan expiry — daily at midnight UTC.
  cron.schedule('0 0 * * *', () => {
    logger.info('Running: planExpiry');
    void planExpiryJob().catch((e) => logger.error({ err: e }, 'planExpiry job failed'));
  });

  logger.info('Cron jobs registered (3 jobs)');
}
