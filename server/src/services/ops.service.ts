import mongoose from 'mongoose';
import { env } from '../config/env';
import { getRedis } from '../config/redis';
import { listJobs } from '../jobs/jobRegistry';

export type ComponentStatus = 'ok' | 'degraded' | 'down' | 'disabled';

interface ComponentHealth {
  status: ComponentStatus;
  detail: string;
}

const MONGO_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const OpsService = {
  /** Aggregated operational status across infra + integrations + jobs. */
  async getStatus() {
    const [redis, database] = await Promise.all([checkRedis(), checkDatabase()]);

    const email: ComponentHealth = env.RESEND_API_KEY
      ? { status: 'ok', detail: 'Resend configured' }
      : { status: 'disabled', detail: 'RESEND_API_KEY not set (dev log mode)' };

    const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
    const webhookConfigured = Boolean(env.STRIPE_WEBHOOK_SECRET);
    const stripe: ComponentHealth = !stripeConfigured
      ? { status: 'disabled', detail: 'STRIPE_SECRET_KEY not set' }
      : webhookConfigured
        ? { status: 'ok', detail: 'Secret + webhook configured' }
        : { status: 'degraded', detail: 'Secret set but STRIPE_WEBHOOK_SECRET missing' };

    const ai: ComponentHealth = {
      status: 'ok',
      detail: `Active provider: ${env.AI_PROVIDER}`,
    };

    const mem = process.memoryUsage();
    const jobs = listJobs();

    const components = { database, redis, email, stripe, ai };
    const anyDown = Object.values(components).some((c) => c.status === 'down');
    const anyDegraded = Object.values(components).some((c) => c.status === 'degraded');

    return {
      overall: anyDown ? 'down' : anyDegraded ? 'degraded' : 'ok',
      generatedAt: new Date().toISOString(),
      server: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        environment: env.NODE_ENV,
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
      },
      components,
      jobs: jobs.map((j) => ({
        name: j.name,
        schedule: j.schedule,
        description: j.description,
        status: j.status,
        lastRunAt: j.lastRunAt,
        lastDurationMs: j.lastDurationMs,
        lastError: j.lastError,
        runCount: j.runCount,
        failureCount: j.failureCount,
      })),
    };
  },
};

async function checkRedis(): Promise<ComponentHealth> {
  const client = getRedis();
  if (!client) return { status: 'disabled', detail: 'REDIS_URL not set (caching disabled)' };
  try {
    const pong = await client.ping();
    return pong === 'PONG'
      ? { status: 'ok', detail: 'Reachable' }
      : { status: 'degraded', detail: `Unexpected ping reply: ${pong}` };
  } catch (err) {
    return { status: 'down', detail: err instanceof Error ? err.message : 'Ping failed' };
  }
}

async function checkDatabase(): Promise<ComponentHealth> {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    return { status: state === 2 ? 'degraded' : 'down', detail: MONGO_STATES[state] ?? 'unknown' };
  }
  try {
    await mongoose.connection.db?.admin().ping();
    return { status: 'ok', detail: `connected → ${mongoose.connection.name}` };
  } catch (err) {
    return { status: 'down', detail: err instanceof Error ? err.message : 'Ping failed' };
  }
}
