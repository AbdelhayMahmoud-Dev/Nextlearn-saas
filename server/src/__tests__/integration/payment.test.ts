import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, login, makeCourse, makeTenant, makeUser } from '../helpers';

const request = supertest(app);

describe('Payments & enrollment access control', () => {
  it('returns 503 for checkout when Stripe is not configured', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const student = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 49 });
    const token = await login(request, tenant._id.toString(), student.email);

    const res = await request
      .post('/api/v1/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });
    expect(res.status).toBe(503);
  });

  it('allows free enrollment in a free course', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const student = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 0 });
    const token = await login(request, tenant._id.toString(), student.email);

    const res = await request
      .post('/api/v1/enrollments/free')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');
  });

  it('blocks direct enrollment in a paid course with 402', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const student = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 99 });
    const token = await login(request, tenant._id.toString(), student.email);

    const res = await request
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });
    expect(res.status).toBe(402);
  });

  it('rejects free enrollment for a paid course with 400', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const student = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 99 });
    const token = await login(request, tenant._id.toString(), student.email);

    const res = await request
      .post('/api/v1/enrollments/free')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString() });
    expect(res.status).toBe(400);
  });
});
