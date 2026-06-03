import cron, { type ScheduledTask } from 'node-cron';
import { logger } from '../utils/logger';
import { subscriptionExpiryJob } from './subscriptionExpiry.job';
import { weeklyDigestJob } from './weeklyDigest.job';
import { planExpiryJob } from './planExpiry.job';
import { registerJob, runTracked } from './jobRegistry';

/** Live handles to every scheduled task, so they can be stopped on shutdown. */
const scheduledTasks: ScheduledTask[] = [];

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
    const task = cron.schedule(job.schedule, () => {
      logger.info(`Running: ${job.name}`);
      void runTracked(job.name, job.run).catch((e) =>
        logger.error({ err: e }, `${job.name} job failed`),
      );
    });
    scheduledTasks.push(task);
  }

  logger.info(`Cron jobs registered (${JOBS.length} jobs)`);
}

/**
 * Stops all scheduled cron tasks. Called during graceful shutdown so the
 * process can exit cleanly without timers keeping the event loop alive.
 */
export function stopJobs(): void {
  for (const task of scheduledTasks.splice(0)) {
    task.stop();
  }
  logger.info('Cron jobs stopped');
}
