import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let client: Redis | null = null;

/**
 * Returns a singleton Redis client, or `null` when `REDIS_URL` is not set.
 * Callers must handle the null case so the app runs without Redis in dev.
 */
export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (client) return client;

  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error({ err }, 'Redis error'));

  return client;
}

/** Gracefully closes the Redis connection (used during shutdown). */
export async function disconnectRedis(): Promise<void> {
  if (!client) return;
  await client.quit();
  client = null;
  logger.info('Redis connection closed');
}

/**
 * Cache-aside helper: returns the cached value on hit, otherwise runs `factory`,
 * stores its result for `ttlSeconds`, and returns it. Fully degrades without
 * Redis (just runs the factory) and never throws on cache errors.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  factory: () => Promise<T>,
): Promise<T> {
  const r = getRedis();
  if (!r) return factory();
  try {
    const cached = await r.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Cache read failure → fall through to the factory.
  }
  const value = await factory();
  try {
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache store failure is non-fatal.
  }
  return value;
}

/** Invalidates a cache key, or all keys matching a `*` wildcard pattern. */
export async function invalidateCache(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    if (key.includes('*')) {
      const keys = await r.keys(key);
      if (keys.length) await r.del(...keys);
    } else {
      await r.del(key);
    }
  } catch {
    // Non-fatal.
  }
}
