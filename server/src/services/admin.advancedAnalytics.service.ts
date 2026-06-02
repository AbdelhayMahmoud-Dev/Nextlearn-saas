import { Types } from 'mongoose';
import { Payment } from '../models/Payment.model';
import { User } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { Certificate } from '../models/Certificate.model';
import { withCache } from '../config/redis';

function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** First day of the month `n` months before `from` (defaults to now). */
function monthsAgo(n: number, from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth() - n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const AdminAdvancedAnalyticsService = {
  /**
   * Conversion funnel: enrolled → started (>0% progress) → completed (100%) →
   * certified. Counts are tenant-wide over all enrollments.
   */
  async funnel(tenantId: string) {
    return withCache(`adv:funnel:${tenantId}`, 5 * 60, async () => {
      const tid = new Types.ObjectId(tenantId);
      const [stages] = await Enrollment.aggregate<{
        enrolled: number;
        started: number;
        completed: number;
      }>([
        { $match: { tenantId: tid } },
        {
          $group: {
            _id: null,
            enrolled: { $sum: 1 },
            started: { $sum: { $cond: [{ $gt: ['$progress.percentage', 0] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $gte: ['$progress.percentage', 100] }, 1, 0] } },
          },
        },
      ]);
      const certified = await Certificate.countDocuments({ tenantId: tid });

      const enrolled = stages?.enrolled ?? 0;
      const rate = (n: number): number =>
        enrolled === 0 ? 0 : Math.round((n / enrolled) * 1000) / 10;

      return [
        { stage: 'Enrolled', count: enrolled, rate: 100 },
        { stage: 'Started', count: stages?.started ?? 0, rate: rate(stages?.started ?? 0) },
        { stage: 'Completed', count: stages?.completed ?? 0, rate: rate(stages?.completed ?? 0) },
        { stage: 'Certified', count: certified, rate: rate(certified) },
      ];
    });
  },

  /**
   * Signup → first-enrollment retention by monthly cohort for the last 6 months.
   * Returns, per cohort, the cohort size and the % who ever enrolled.
   */
  async cohorts(tenantId: string) {
    return withCache(`adv:cohorts:${tenantId}`, 10 * 60, async () => {
      const tid = new Types.ObjectId(tenantId);
      const start = monthsAgo(5);

      const rows = await User.aggregate<{
        _id: string;
        size: number;
        activated: number;
      }>([
        { $match: { tenantId: tid, createdAt: { $gte: start }, role: 'student' } },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'userId',
            as: 'enrollments',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            size: { $sum: 1 },
            activated: { $sum: { $cond: [{ $gt: [{ $size: '$enrollments' }, 0] }, 1, 0] } },
          },
        },
      ]);

      const map = new Map(rows.map((r) => [r._id, r]));
      const out: Array<{ cohort: string; size: number; activated: number; activationRate: number }> =
        [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = monthsAgo(i);
        const key = monthKey(d);
        const row = map.get(key);
        const size = row?.size ?? 0;
        const activated = row?.activated ?? 0;
        out.push({
          cohort: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          size,
          activated,
          activationRate: size === 0 ? 0 : Math.round((activated / size) * 1000) / 10,
        });
      }
      return out;
    });
  },

  /**
   * 30-day rolling retention: of users who enrolled in a month, the share who
   * had any lesson-completion activity in the following 30 days.
   */
  async retention(tenantId: string) {
    return withCache(`adv:retention:${tenantId}`, 10 * 60, async () => {
      const tid = new Types.ObjectId(tenantId);
      const start = monthsAgo(5);

      // Returning users = enrollments whose course progress advanced past the
      // first lesson (proxy for continued engagement).
      const rows = await Enrollment.aggregate<{ _id: string; total: number; retained: number }>([
        { $match: { tenantId: tid, createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: 1 },
            retained: {
              $sum: { $cond: [{ $gt: [{ $size: '$progress.completedLessons' }, 1] }, 1, 0] },
            },
          },
        },
      ]);

      const map = new Map(rows.map((r) => [r._id, r]));
      const out: Array<{ month: string; total: number; retained: number; retentionRate: number }> =
        [];
      for (let i = 5; i >= 0; i -= 1) {
        const d = monthsAgo(i);
        const row = map.get(monthKey(d));
        const total = row?.total ?? 0;
        const retained = row?.retained ?? 0;
        out.push({
          month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          total,
          retained,
          retentionRate: total === 0 ? 0 : Math.round((retained / total) * 1000) / 10,
        });
      }
      return out;
    });
  },

  /**
   * Revenue forecast: 12 months of history + a 3-month projection via ordinary
   * least-squares linear regression on monthly totals.
   */
  async revenueForecast(tenantId: string) {
    return withCache(`adv:forecast:${tenantId}`, 30 * 60, async () => {
      const tid = new Types.ObjectId(tenantId);
      const start = monthsAgo(11);

      const rows = await Payment.aggregate<{ _id: string; total: number }>([
        { $match: { tenantId: tid, status: 'completed', createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: '$amount' },
          },
        },
      ]);
      const map = new Map(rows.map((r) => [r._id, r.total]));

      const history: Array<{ month: string; revenue: number }> = [];
      const series: number[] = [];
      for (let i = 0; i < 12; i += 1) {
        const d = monthsAgo(11 - i);
        const revenue = centsToDollars(map.get(monthKey(d)) ?? 0);
        series.push(revenue);
        history.push({
          month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          revenue,
        });
      }

      // OLS slope/intercept over index 0..11.
      const n = series.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = series.reduce((a, b) => a + b, 0);
      const sumXY = series.reduce((acc, y, x) => acc + x * y, 0);
      const sumXX = series.reduce((acc, _y, x) => acc + x * x, 0);
      const denom = n * sumXX - sumX * sumX;
      const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      const forecast: Array<{ month: string; revenue: number; projected: true }> = [];
      for (let k = 0; k < 3; k += 1) {
        const x = n + k;
        const d = new Date();
        d.setMonth(d.getMonth() + k + 1, 1);
        forecast.push({
          month: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.max(0, Math.round((intercept + slope * x) * 100) / 100),
          projected: true,
        });
      }

      return {
        history,
        forecast,
        trend: {
          monthlyChange: Math.round(slope * 100) / 100,
          direction: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
        },
      };
    });
  },

  /**
   * Per-course performance: enrollments, completion rate, avg progress, revenue,
   * rating. Sorted by enrollments.
   */
  async coursePerformance(tenantId: string, limit = 50) {
    const tid = new Types.ObjectId(tenantId);
    return Enrollment.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: '$courseId',
          enrollments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $gte: ['$progress.percentage', 100] }, 1, 0] } },
          avgProgress: { $avg: '$progress.percentage' },
        },
      },
      { $sort: { enrollments: -1 } },
      { $limit: limit },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'payments',
          let: { cid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$courseId', '$$cid'] }, { $eq: ['$status', 'completed'] }],
                },
              },
            },
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
          category: '$course.category',
          enrollments: 1,
          completionRate: {
            $cond: [
              { $gt: ['$enrollments', 0] },
              { $round: [{ $multiply: [{ $divide: ['$completed', '$enrollments'] }, 100] }, 1] },
              0,
            ],
          },
          avgProgress: { $round: [{ $ifNull: ['$avgProgress', 0] }, 1] },
          rating: '$course.rating.average',
          revenue: { $divide: [{ $ifNull: [{ $arrayElemAt: ['$pay.total', 0] }, 0] }, 100] },
        },
      },
    ]);
  },

  /**
   * Per-instructor performance: course count, total students, avg rating, and
   * total revenue across their courses.
   */
  async instructorPerformance(tenantId: string, limit = 50) {
    const tid = new Types.ObjectId(tenantId);
    return Course.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: '$instructorId',
          courses: { $sum: 1 },
          published: { $sum: { $cond: ['$isPublished', 1, 0] } },
          students: { $sum: '$enrolledCount' },
          ratingSum: { $sum: { $multiply: ['$rating.average', '$rating.count'] } },
          ratingCount: { $sum: '$rating.count' },
          courseIds: { $push: '$_id' },
        },
      },
      { $sort: { students: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'instructor' } },
      { $unwind: '$instructor' },
      {
        $lookup: {
          from: 'payments',
          let: { ids: '$courseIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $in: ['$courseId', '$$ids'] }, { $eq: ['$status', 'completed'] }],
                },
              },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          as: 'pay',
        },
      },
      {
        $project: {
          _id: 0,
          instructorId: { $toString: '$_id' },
          name: '$instructor.name',
          email: '$instructor.email',
          courses: 1,
          published: 1,
          students: 1,
          avgRating: {
            $cond: [
              { $gt: ['$ratingCount', 0] },
              { $round: [{ $divide: ['$ratingSum', '$ratingCount'] }, 1] },
              0,
            ],
          },
          revenue: { $divide: [{ $ifNull: [{ $arrayElemAt: ['$pay.total', 0] }, 0] }, 100] },
        },
      },
    ]);
  },
};
