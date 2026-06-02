import { Types } from 'mongoose';
import { createApp } from '../app';
import { Tenant } from '../models/Tenant.model';
import { User, UserRole } from '../models/User.model';
import { Course } from '../models/Course.model';

/** Shared Express app for supertest (built once). */
export const app = createApp();

let tenantCounter = 0;

/** Creates an active tenant with a unique slug. */
export async function makeTenant(name = 'Test Academy') {
  tenantCounter += 1;
  return Tenant.create({
    name,
    slug: `test-tenant-${Date.now()}-${tenantCounter}`,
    isActive: true,
    plan: 'pro',
  });
}

const STRONG_PASSWORD = 'Password123';

/** Creates a user directly (password hashed by the model pre-save hook). */
export async function makeUser(
  tenantId: Types.ObjectId,
  opts: { email?: string; role?: UserRole; isActive?: boolean } = {},
) {
  tenantCounter += 1;
  return User.create({
    tenantId,
    name: 'Test User',
    email: opts.email ?? `user${Date.now()}-${tenantCounter}@test.com`,
    password: STRONG_PASSWORD,
    role: opts.role ?? 'student',
    isVerified: true,
    isActive: opts.isActive ?? true,
  });
}

/** Logs a user in via the real auth endpoint and returns their access token. */
export async function login(
  request: ReturnType<typeof import('supertest')>,
  tenantId: string,
  email: string,
): Promise<string> {
  const res = await request
    .post('/api/v1/auth/login')
    .set('x-tenant-id', tenantId)
    .send({ email, password: STRONG_PASSWORD });
  return res.body?.data?.accessToken as string;
}

/** Creates a course for a tenant/instructor. */
export async function makeCourse(
  tenantId: Types.ObjectId,
  instructorId: Types.ObjectId,
  opts: { price?: number; published?: boolean; title?: string } = {},
) {
  tenantCounter += 1;
  const title = opts.title ?? `Test Course ${tenantCounter}`;
  return Course.create({
    tenantId,
    instructorId,
    title,
    slug: `test-course-${Date.now()}-${tenantCounter}`,
    category: 'Programming',
    price: opts.price ?? 0,
    isPublished: opts.published ?? true,
    isApproved: true,
  });
}

export { STRONG_PASSWORD };
