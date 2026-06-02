import { connectDB, disconnectDB } from '../config/db';
import { Tenant } from '../models/Tenant.model';
import { logger } from '../utils/logger';

/**
 * Idempotently creates (or updates) a demo tenant for local development.
 * Prints the tenant's ObjectId, which the API client / smoke tests pass as
 * the `x-tenant-id` header.
 *
 *   npm run seed:tenant
 */
async function seedTenant(): Promise<void> {
  await connectDB();

  const slug = 'demo';
  const tenant = await Tenant.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        slug,
        name: 'Demo Academy',
        plan: 'pro',
        isActive: true,
        branding: { primaryColor: '#6366f1', accentColor: '#8b5cf6', font: 'Inter' },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  logger.info(`✅ Demo tenant ready: slug="${tenant.slug}" id=${tenant._id.toString()}`);
  // eslint-disable-next-line no-console
  console.log(tenant._id.toString());

  await disconnectDB();
}

seedTenant().catch((err) => {
  logger.error({ err }, 'Failed to seed tenant');
  process.exit(1);
});
