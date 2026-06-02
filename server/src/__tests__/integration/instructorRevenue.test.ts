import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { AnalyticsService } from '../../services/analytics.service';
import { Payment } from '../../models/Payment.model';
import { Enrollment } from '../../models/Enrollment.model';
import { makeCourse, makeTenant, makeUser } from '../helpers';

describe('Instructor revenue & dashboard (wired to Payments)', () => {
  it('reports real revenue from completed payments, not zero', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const buyer = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 49 });

    await Payment.create({
      tenantId: tenant._id,
      userId: buyer._id,
      courseId: course._id,
      amount: 4900, // cents
      currency: 'USD',
      status: 'completed',
      type: 'one-time',
    });
    // A pending payment must NOT count.
    await Payment.create({
      tenantId: tenant._id,
      userId: buyer._id,
      courseId: course._id,
      amount: 9900,
      currency: 'USD',
      status: 'pending',
      type: 'one-time',
    });

    const revenue = await AnalyticsService.instructorRevenue(
      tenant._id.toString(),
      instructor._id.toString(),
    );
    expect(revenue.totalRevenue).toBe(49);
    expect(revenue.availablePayout).toBe(49);
    expect(revenue.revenueByCourse).toHaveLength(1);
    expect(revenue.revenueByCourse[0].revenue).toBe(49);
    expect(revenue.revenueByMonth).toHaveLength(12);
  });

  it('reflects revenue + completion in the instructor dashboard', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const buyer = await makeUser(tenant._id, { role: 'student' });
    const course = await makeCourse(tenant._id, instructor._id, { price: 30 });

    await Payment.create({
      tenantId: tenant._id,
      userId: buyer._id,
      courseId: course._id,
      amount: 3000,
      currency: 'USD',
      status: 'completed',
      type: 'one-time',
    });
    await Enrollment.create({
      tenantId: tenant._id,
      userId: buyer._id,
      courseId: course._id,
      status: 'active',
      progress: { completedLessons: [new Types.ObjectId()], percentage: 100 },
      enrolledAt: new Date(),
    });

    const dash = await AnalyticsService.instructorDashboard(
      tenant._id.toString(),
      instructor._id.toString(),
    );
    expect(dash.overview.totalRevenue).toBe(30);
    expect(dash.topCourses[0].revenue).toBe(30);
    expect(dash.topCourses[0].completionRate).toBe(100);
  });

  it('returns zeros cleanly for an instructor with no courses', async () => {
    const tenant = await makeTenant();
    const instructor = await makeUser(tenant._id, { role: 'instructor' });
    const revenue = await AnalyticsService.instructorRevenue(
      tenant._id.toString(),
      instructor._id.toString(),
    );
    expect(revenue.totalRevenue).toBe(0);
    expect(revenue.revenueByCourse).toEqual([]);
  });
});
