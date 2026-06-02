import cron from 'node-cron';
import { logger } from '../utils/logger';
import { subscriptionExpiryJob } from './subscriptionExpiry.job';
import { weeklyDigestJob } from './weeklyDigest.job';
import { planExpiryJob } from './planExpiry.job';
import { registerJob, runTracked } from './jobRegistry';

interface JobDef {
  name: string;
  schedule: string;
  description: string;
  run: () => Promise<void>;
}

const JOBS: JobDef[] = [
  {
    name: 'subscriptionExpiry',
    schedule: '0 * * * *',
    description: 'Expires lapsed subscriptions',
    run: subscriptionExpiryJob,
  },
  {
    name: 'weeklyDigest',
    schedule: '0 9 * * 1',
    description: 'Sends the weekly learning digest',
    run: weeklyDigestJob,
  },
  {
    name: 'planExpiry',
    schedule: '0 0 * * *',
    description: 'Downgrades tenants whose plan has expired',
    run: planExpiryJob,
  },
];

/**
 * Registers all cron jobs. Call once at startup (after the DB connects).
 * Each tick is tracked (timing + success/failure) for the ops dashboard and
 * catches its own errors so a failing job never crashes the server.
 */
export function registerJobs(): void {
  for (const job of JOBS) {
    registerJob(job.name, job.schedule, job.description);
    cron.schedule(job.schedule, () => {
      logger.info(`Running: ${job.name}`);
      void runTracked(job.name, job.run).catch((e) =>
        logger.error({ err: e }, `${job.name} job failed`),
      );
    });
  }

  logger.info(`Cron jobs registered (${JOBS.length} jobs)`);
}
