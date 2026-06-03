import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

let isConnected = false;

/**
 * Returns the explicit database name from a MongoDB connection string, or null
 * if none is present (in which case the driver silently falls back to the
 * `test` database). A missing db name is a classic production footgun: the app
 * connects "successfully" but to an empty default DB, so every tenant lookup
 * 404s and the app looks broken with no obvious cause.
 */
function getUriDbName(uri: string): string | null {
  try {
    // Strip protocol, then take the path segment after the host list, before `?`.
    const afterScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const afterHost = afterScheme.slice(afterScheme.indexOf('/') + 1);
    if (!afterScheme.includes('/')) return null;
    const dbName = afterHost.split('?')[0];
    return dbName.length > 0 ? dbName : null;
  } catch {
    return null;
  }
}

/**
 * Establishes (or reuses) a pooled MongoDB connection.
 * Idempotent — safe to call multiple times; only connects once.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;

  if (!getUriDbName(env.MONGODB_URI)) {
    logger.warn(
      'MONGODB_URI has no database name — MongoDB will use the default "test" database. ' +
        'Set an explicit db name (e.g. mongodb+srv://host/nextlearn?...) so prod and seed scripts agree.',
    );
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      autoIndex: !env.isProd, // build indexes automatically off-prod; manage explicitly in prod
    });
    isConnected = true;
    logger.info(`MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    throw err;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB connection error');
});

/** Gracefully closes the MongoDB connection (used during shutdown). */
export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB connection closed');
}
