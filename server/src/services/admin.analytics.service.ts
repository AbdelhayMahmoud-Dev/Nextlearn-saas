import { Types } from 'mongoose';
import { Payment } from '../models/Payment.model';
import { User } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { Subscription } from '../models/Subscription.model';
import { withCache } from '../config/redis';

const MONTHLY_PRICE = 29;
const ANNUAL_MONTHLY_EQUIV = 199 / 12;

/** Percentage change of `current` vs `previous` (0 when previous is 0). */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Sums completed-payment cents from an aggregate result into dollars. */
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export const AdminAnalyticsService = {
  /** Platform-wide KPIs (current month vs previous month for growth). */
  async getDashboardKPIs(tenantId: string) {
    // Analytics are expensive + tolerant of slight staleness → cache 5 min.
    return withCache(`admin:kpis:${tenantId}`, 5 * 60, async () => {
    const tid = new Types.ObjectId(tenantId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sumCompleted = async (from?: Date, to?: Date): Promise<number> => {
      const match: Record<string, unknown> = { tenantId: tid, status: 'completed' };
      if (from || to) {
        match.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lt: to } : {}) };
      }
      const rows = await Payment.aggregate<{ total: number }>([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return centsToDollars(rows[0]?.total ?? 0);
    };

    const countUsers = async (from?: Date, to?: Date): Promise<number> => {
      const match: Record<string, unknown> = { tenantId: tid };
      if (from || to) {
        match.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lt: to } : {}) };
      }
      const rows = await User.aggregate<{ count: number }>([
        { $match: match },
        { $count: 'count' },
      ]);
      return rows[0]?.count ?? 0;
    };

    const countEnrollments = async (from?: Date, to?: Date): Promise<number> => {
      const match: Record<string, unknown> = { tenantId: tid };
      if (from || to) {
        match.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lt: to } : {}) };
      }
      const rows = await Enrollment.aggregate<{ count: number }>([
        { $match: match },
        { $count: 'count' },
      ]);
      return rows[0]?.count ?? 0;
    };

    const [
      totalRevenue,
      monthlyRevenue,
      prevMonthRevenue,
      totalUsers,
      newUsersThisMonth,
      prevMonthUsers,
      totalEnrollments,
      newEnrollmentsThisMonth,
      prevMonthEnrollments,
      courseStats,
      ratingRows,
      subRows,
      churnRows,
    ] = await Promise.all([
      sumCompleted(),
      sumCompleted(startOfMonth),
      sumCompleted(startOfPrevMonth, startOfMonth),
      countUsers(),
      countUsers(startOfMonth),
      countUsers(startOfPrevMonth, startOfMonth),
      countEnrollments(),
      countEnrollments(startOfMonth),
      countEnrollments(startOfPrevMonth, startOfMonth),
      Course.aggregate<{ _id: null; total: number; published: number }>([
        { $match: { tenantId: tid } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            published: { $sum: { $cond: ['$isPublished', 1, 0] } },
          },
        },
      ]),
      Course.aggregate<{ _id: null; avg: number }>([
        { $match: { tenantId: tid, 'rating.count': { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$rating.average' } } },
      ]),
      Subscription.aggregate<{ _id: string; count: number }>([
        { $match: { tenantId: tid, status: { $in: ['active', 'trialing'] } } },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      Subscription.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            tenantId: tid,
            $or: [
              { status: { $in: ['active', 'trialing'] } },
              { status: 'canceled', updatedAt: { $gte: thirtyDaysAgo } },
            ],
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const subMap = new Map(subRows.map((r) => [r._id, r.count]));
    const monthlySubs = subMap.get('monthly') ?? 0;
    const annualSubs = subMap.get('annual') ?? 0;
    const activeSubscriptions = monthlySubs + annualSubs;
    const monthlyRecurringRevenue =
      Math.round((monthlySubs * MONTHLY_PRICE + annualSubs * ANNUAL_MONTHLY_EQUIV) * 100) / 100;

    const churnMap = new Map(churnRows.map((r) => [r._id, r.count]));
    const canceled = churnMap.get('canceled') ?? 0;
    const activeForChurn = churnRows
      .filter((r) => r._id === 'active' || r._id === 'trialing')
      .reduce((sum, r) => sum + r.count, 0);
    const churnRate =
      activeForChurn + canceled === 0
        ? 0
        : Math.round((canceled / (activeForChurn + canceled)) * 1000) / 10;

    return {
      totalRevenue,
      monthlyRevenue,
      revenueGrowth: pctChange(monthlyRevenue, prevMonthRevenue),
      totalUsers,
      newUsersThisMonth,
      userGrowth: pctChange(newUsersThisMonth, prevMonthUsers),
      totalEnrollments,
      newEnrollmentsThisMonth,
      enrollmentGrowth: pctChange(newEnrollmentsThisMonth, prevMonthEnrollments),
      totalCourses: courseStats[0]?.total ?? 0,
      publishedCourses: courseStats[0]?.published ?? 0,
      averageRating: Math.round((ratingRows[0]?.avg ?? 0) * 10) / 10,
      activeSubscriptions,
      monthlyRecurringRevenue,
      churnRate,
      };
    });
  },

  /** Monthly revenue + enrollment + subscription counts for the last 12 months. */
  async getRevenueChart(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const start = new Date();
    start.setMonth(start.getMonth() - 11, 1);
    start.setHours(0, 0, 0, 0);

    const fmt = { format: '%Y-%m', date: '$createdAt' } as const;

    const [revenue, enrollments, subscriptions] = await Promise.all([
      Payment.aggregate<{ _id: string; total: number }>([
        { $match: { tenantId: tid, status: 'completed', createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: fmt }, total: { $sum: '$amount' } } },
      ]),
      Enrollment.aggregate<{ _id: string; count: number }>([
        { $match: { tenantId: tid, createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: fmt }, count: { $sum: 1 } } },
      ]),
      Subscription.aggregate<{ _id: string; count: number }>([
        { $match: { tenantId: tid, createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: fmt }, count: { $sum: 1 } } },
      ]),
    ]);

    const revMap = new Map(revenue.map((r) => [r._id, r.total]));
    const enrMap = new Map(enrollments.map((r) => [r._id, r.count]));
    const subMap = new Map(subscriptions.map((r) => [r._id, r.count]));

    const out: Array<{ month: string; revenue: number; enrollments: number; subscriptions: number }> = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({
        month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        revenue: centsToDollars(revMap.get(key) ?? 0),
        enrollments: enrMap.get(key) ?? 0,
        subscriptions: subMap.get(key) ?? 0,
      });
    }
    return out;
  },

  /** Daily new-user registrations for the last 30 days (zero-filled). */
  async getUserGrowthChart(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    const rows = await User.aggregate<{ _id: string; count: number }>([
      { $match: { tenantId: tid, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);
    const map = new Map(rows.map((r) => [r._id, r.count]));

    const out: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, count: map.get(key) ?? 0 });
    }
    return out;
  },

  /** Top 10 courses by enrollment, with revenue, rating, and completion rate. */
  async getTopCourses(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const rows = await Enrollment.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: '$courseId',
          enrollments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $gte: ['$progress.percentage', 100] }, 1, 0] } },
        },
      },
      { $sort: { enrollments: -1 } },
      { $limit: 10 },
      {
        $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' },
      },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'payments',
          let: { cid: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$courseId', '$$cid'] }, { $eq: ['$status', 'completed'] }] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          as: 'pay',
        },
      },
      {
        $project: {
          _id: 0,
          courseId: { $toString: '$_id' },
          title: '$course.title',
          thumbnail: '$course.thumbnail',
          enrollments: 1,
          rating: '$course.rating.average',
          revenue: { $divide: [{ $ifNull: [{ $arrayElemAt: ['$pay.total', 0] }, 0] }, 100] },
          completionRate: {
            $cond: [
              { $gt: ['$enrollments', 0] },
              { $round: [{ $multiply: [{ $divide: ['$completed', '$enrollments'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
    ]);
    return rows;
  },

  /** Enrollment + revenue distribution by course category. */
  async getCategoryBreakdown(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const rows = await Course.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: '$category',
          courseCount: { $sum: 1 },
          enrollments: { $sum: '$enrolledCount' },
        },
      },
      {
        $lookup: {
          from: 'courses',
          let: { cat: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$category', '$$cat'] } } },
            { $project: { _id: 1 } },
            {
              $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'courseId',
                as: 'pay',
              },
            },
            { $unwind: { path: '$pay', preserveNullAndEmptyArrays: false } },
            { $match: { 'pay.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$pay.amount' } } },
          ],
          as: 'rev',
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          courseCount: 1,
          enrollments: 1,
          revenue: { $divide: [{ $ifNull: [{ $arrayElemAt: ['$rev.total', 0] }, 0] }, 100] },
        },
      },
      { $sort: { enrollments: -1 } },
    ]);
    return rows;
  },
};
