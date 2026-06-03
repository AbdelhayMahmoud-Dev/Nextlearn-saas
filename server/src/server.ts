import type { Server } from 'http';
import { createApp, createHttpServer } from './app';
import { connectDB, disconnectDB } from './config/db';
import { getRedis, disconnectRedis } from './config/redis';
import { closeSocket } from './config/socket';
import { registerJobs, stopJobs } from './jobs';
import { env } from './config/env';
import { logger } from './utils/logger';

/**
 * Single source of truth for the listen port. Railway/Render/Heroku inject
 * `PORT`; locally it falls back to the env default (8080). There is exactly ONE
 * `listen()` call in the entire codebase — here, in `startServer()`.
 */
const PORT = env.PORT;

/** Connects to MongoDB. Must complete before services start. */
async function initializeDatabase(): Promise<void> {
  await connectDB();
  getRedis(); // lazily initializes Redis if REDIS_URL is configured (no-op otherwise)
}

/** Registers cron jobs. Runs after the DB is connected so jobs can query it. */
function initializeCronJobs(): void {
  registerJobs();
}

/**
 * Builds the Express app + HTTP server with Socket.io attached. Socket.io is
 * initialised inside `createHttpServer` so the upgrade handler is bound to the
 * single HTTP server before it listens.
 */
function buildServer(): Server {
  const app = createApp();
  return createHttpServer(app); // Express app + Socket.io on one HTTP server
}

let shuttingDown = false;

/**
 * Gracefully tears everything down in the reverse order it was brought up:
 * stop cron timers → disconnect Socket.io clients + close the HTTP server →
 * close MongoDB → close Redis. Idempotent (guards against double-invocation
 * from overlapping signals) and bounded by a hard-stop timeout so a stuck
 * connection can never wedge the process and keep the port held.
 */
async function shutdown(server: Server, signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — shutting down gracefully`);

  // Hard-stop if graceful shutdown stalls. `unref()` so the timer itself never
  // keeps the event loop alive.
  const forceExit = setTimeout(() => {
    logger.error('Could not close connections in time — forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    stopJobs();
    // closeSocket() disconnects all WebSocket clients AND closes the underlying
    // HTTP server (Socket.io owns it). Without this, persistent connections keep
    // the server open forever and the process is force-killed while still
    // holding the port — the root cause of redeploy EADDRINUSE.
    await closeSocket();
    // Defensive: ensure the HTTP server is closed even if Socket.io wasn't up.
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDB();
    await disconnectRedis();
    clearTimeout(forceExit);
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

/** Binds the single HTTP listener. The LAST step of the boot sequence. */
function startServer(server: Server): void {
  // Surface listen-time failures (EADDRINUSE, EACCES) explicitly instead of
  // letting them bubble up as an opaque "uncaughtException".
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.fatal(`Port ${PORT} is already in use — refusing to start a second listener. Exiting.`);
    } else {
      logger.fatal({ err }, 'HTTP server error');
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    logger.info(`🚀 NextLearn API ready on port ${PORT} [${env.NODE_ENV}]`);
  });
}

/**
 * Boot sequence — exactly one path, run once:
 *   1. database + cache connect
 *   2. cron jobs register
 *   3. HTTP server (with Socket.io) is built
 *   4. server listens (the ONLY listen() call)
 */
async function bootstrap(): Promise<void> {
  await initializeDatabase();
  initializeCronJobs();

  const server = buildServer();

  process.on('SIGTERM', () => void shutdown(server, 'SIGTERM'));
  process.on('SIGINT', () => void shutdown(server, 'SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — exiting');
    process.exit(1);
  });

  startServer(server);
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
