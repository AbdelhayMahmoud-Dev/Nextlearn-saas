import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app, login, makeCourse, makeTenant, makeUser } from '../helpers';

const request = supertest(app);

describe('Affiliate attribution', () => {
  it('counts a conversion when a free enrollment carries a referral code', async () => {
    const tenant = await makeTenant();
    const tid = tenant._id.toString();
    const affiliateUser = await makeUser(tenant._id, { role: 'instructor' });
    const buyer = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, affiliateUser._id, { price: 0 });

    // Affiliate account is created on first dashboard access.
    const affToken = await login(request, tid, affiliateUser.email);
    const dash = await request.get('/api/v1/affiliate/me').set('Authorization', `Bearer ${affToken}`);
    expect(dash.status).toBe(200);
    const code = dash.body.data.account.code as string;
    expect(code).toBeTruthy();

    // Buyer enrolls in a free course with the referral code attached.
    const buyerToken = await login(request, tid, buyer.email);
    const enroll = await request
      .post('/api/v1/enrollments/free')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ courseId: course._id.toString(), referralCode: code });
    expect(enroll.status).toBe(201);

    // Conversion is recorded (free course → no commission, but a conversion).
    const after = await request.get('/api/v1/affiliate/me').set('Authorization', `Bearer ${affToken}`);
    expect(after.body.data.account.totalConversions).toBeGreaterThanOrEqual(1);
    expect(after.body.data.account.pendingCents).toBe(0);
  });

  it('ignores an unknown referral code without failing the enrollment', async () => {
    const tenant = await makeTenant();
    const tid = tenant._id.toString();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const buyer = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 0 });
    const token = await login(request, tid, buyer.email);

    const res = await request
      .post('/api/v1/enrollments/free')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString(), referralCode: 'NONEXISTENT' });
    expect(res.status).toBe(201);
  });
});
