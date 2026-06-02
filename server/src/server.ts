import type { Server } from 'http';
import { createApp, createHttpServer } from './app';
import { connectDB, disconnectDB } from './config/db';
import { getRedis, disconnectRedis } from './config/redis';
import { registerJobs } from './jobs';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  await connectDB();
  getRedis(); // lazily initializes Redis if REDIS_URL is configured
  registerJobs(); // cron jobs — registered only after the DB is connected

  const app = createApp();
  const server: Server = createHttpServer(app); // Express app + Socket.io
  server.listen(env.PORT, () => {
    logger.info(`🚀 NextLearn API ready at http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      void (async (): Promise<void> => {
        await disconnectDB();
        await disconnectRedis();
        logger.info('Shutdown complete');
        process.exit(0);
      })();
    });
    // Hard-stop if graceful shutdown stalls.
    setTimeout(() => {
      logger.error('Could not close connections in time — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — exiting');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
