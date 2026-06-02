import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Per-test-file lifecycle: connect to the test DB once, wipe collections
 * between tests for isolation, and drop the DB + disconnect at the end.
 */
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGODB_URI);
  }
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
