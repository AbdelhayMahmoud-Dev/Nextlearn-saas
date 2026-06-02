import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, makeTenant } from '../helpers';

const request = supertest(app);

describe('Auth API', () => {
  it('registers, logs in, and refreshes', async () => {
    const tenant = await makeTenant();
    const tid = tenant._id.toString();
    const email = `newuser-${Date.now()}@test.com`;

    const register = await request
      .post('/api/v1/auth/register')
      .set('x-tenant-id', tid)
      .send({ name: 'New User', email, password: 'Password123', role: 'student' });
    expect(register.status).toBe(201);
    expect(register.body.data.user.email).toBe(email);

    const loginRes = await request
      .post('/api/v1/auth/login')
      .set('x-tenant-id', tid)
      .send({ email, password: 'Password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeTruthy();
    expect(loginRes.body.data.refreshToken).toBeTruthy();
    // Sensitive fields are never returned.
    expect(loginRes.body.data.user.password).toBeUndefined();

    const refresh = await request
      .post('/api/v1/auth/refresh')
      .set('x-tenant-id', tid)
      .send({ refreshToken: loginRes.body.data.refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    const tenant = await makeTenant();
    const tid = tenant._id.toString();
    const email = `wrongpw-${Date.now()}@test.com`;
    await request
      .post('/api/v1/auth/register')
      .set('x-tenant-id', tid)
      .send({ name: 'U', email, password: 'Password123' });

    const res = await request
      .post('/api/v1/auth/login')
      .set('x-tenant-id', tid)
      .send({ email, password: 'WrongPassword9' });
    expect(res.status).toBe(401);
  });

  it('rejects access to a protected route without a token', async () => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects registration validation errors with 400', async () => {
    const tenant = await makeTenant();
    const res = await request
      .post('/api/v1/auth/register')
      .set('x-tenant-id', tenant._id.toString())
      .send({ name: 'U', email: 'not-an-email', password: 'weak' });
    expect(res.status).toBe(400);
  });
});
