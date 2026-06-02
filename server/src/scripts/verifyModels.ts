import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import * as Models from '../models';
import { logger } from '../utils/logger';

/** Registers every model and builds its indexes — surfaces schema/index issues. */
async function run(): Promise<void> {
  void Models; // import for the model-registration side effects
  await connectDB();

  const names = Object.keys(mongoose.models).sort();
  logger.info(`Registered models (${names.length}): ${names.join(', ')}`);

  for (const name of names) {
    await mongoose.models[name].init();
  }
  logger.info('✅ All model schemas compiled and indexes built successfully');

  await disconnectDB();
}

run().catch((err) => {
  logger.error({ err }, 'Model verification failed');
  process.exit(1);
});
