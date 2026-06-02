import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, login, makeCourse, makeTenant, makeUser } from '../helpers';

const request = supertest(app);

describe('Tenant isolation', () => {
  it('scopes catalog reads to the tenant context', async () => {
    const [tenantA, tenantB] = await Promise.all([makeTenant('A'), makeTenant('B')]);
    const instructorB = await makeUser(tenantB._id, { role: 'instructor' });
    const courseB = await makeCourse(tenantB._id, instructorB._id, { published: true });

    // Tenant B's course is visible under tenant B…
    const inB = await request
      .get(`/api/v1/courses/${courseB.slug}`)
      .set('x-tenant-id', tenantB._id.toString());
    expect(inB.status).toBe(200);

    // …but not under tenant A.
    const inA = await request
      .get(`/api/v1/courses/${courseB.slug}`)
      .set('x-tenant-id', tenantA._id.toString());
    expect(inA.status).toBe(404);
  });

  it('admin user listing is scoped to the caller\'s tenant', async () => {
    const [tenantA, tenantB] = await Promise.all([makeTenant('A'), makeTenant('B')]);
    const adminA = await makeUser(tenantA._id, { role: 'admin' });
    await makeUser(tenantA._id, { role: 'student' });
    await makeUser(tenantB._id, { role: 'student' });
    await makeUser(tenantB._id, { role: 'student' });

    const token = await login(request, tenantA._id.toString(), adminA.email);
    const res = await request.get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    // Only tenant A's users (adminA + 1 student) are returned — never tenant B's.
    const emails = (res.body.data as { email: string }[]).map((u) => u.email);
    expect(emails).toContain(adminA.email);
    expect(res.body.data.length).toBe(2);
  });

  it('rejects a token whose tenant conflicts with x-tenant-id', async () => {
    const [tenantA, tenantB] = await Promise.all([makeTenant('A'), makeTenant('B')]);
    const userA = await makeUser(tenantA._id, { role: 'student' });
    const token = await login(request, tenantA._id.toString(), userA.email);

    // Present tenant A's token but claim tenant B via header → 403.
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantB._id.toString());
    expect(res.status).toBe(403);
  });
});
