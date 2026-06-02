import { Types } from 'mongoose';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Review } from '../models/Review.model';
import { Payment } from '../models/Payment.model';

/** A recent enrollment with `userId`/`courseId` populated to lightweight docs. */
type PopulatedRecentEnrollment = {
  userId: { name: string; email: string; avatar?: string } | null;
  courseId: { title: string; slug: string; thumbnail?: string } | null;
  enrolledAt: Date;
};

const centsToDollars = (cents: number): number => Math.round(cents) / 100;

export const AnalyticsService = {
  /** Public platform stats for the marketing homepage. */
  async publicStats(tenantId: string): Promise<{ courses: number; students: number; instructors: number }> {
    const [courses, students, instructors] = await Promise.all([
      Course.countDocuments({ tenantId, isPublished: true }),
      User.countDocuments({ tenantId, role: 'student' }),
      User.countDocuments({ tenantId, role: 'instructor' }),
    ]);
    return { courses, students, instructors };
  },

  /** Instructor dashboard overview — ALL queries use aggregation pipelines. */
  async instructorDashboard(tenantId: string, instructorId: string) {
    const tenantOid = new Types.ObjectId(tenantId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // All courses for this instructor
    const courses = await Course.find({ tenantId, instructorId })
      .select('_id title slug thumbnail isPublished rating enrolledCount')
      .lean();

    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return {
        overview: {
          totalRevenue: 0, monthlyRevenue: 0, revenueGrowth: 0,
          totalStudents: 0, newStudentsThisMonth: 0,
          totalCourses: 0, publishedCourses: 0,
          averageRating: 0, totalReviews: 0,
        },
        revenueChart: [],
        topCourses: [],
        recentEnrollments: [],
      };
    }

    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const completedForCourses = {
      tenantId: tenantOid,
      courseId: { $in: courseIds },
      status: 'completed',
    } as const;

    const [
      totalEnrollments,
      monthEnrollments,
      lastMonthEnrollments,
      reviewAgg,
      recentEnrollRaw,
      revenueTotals,
      revenueByMonthRaw,
      revenueByCourseRaw,
      completionByCourseRaw,
    ] = await Promise.all([
      Enrollment.countDocuments({ tenantId, courseId: { $in: courseIds } }),
      Enrollment.countDocuments({
        tenantId,
        courseId: { $in: courseIds },
        enrolledAt: { $gte: monthStart },
      }),
      Enrollment.countDocuments({
        tenantId,
        courseId: { $in: courseIds },
        enrolledAt: { $gte: lastMonthStart, $lt: monthStart },
      }),
      Review.aggregate<{ avgRating: number; count: number }>([
        { $match: { tenantId: tenantOid, courseId: { $in: courseIds } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Enrollment.find({ tenantId, courseId: { $in: courseIds } })
        .sort({ enrolledAt: -1 })
        .limit(10)
        .populate('userId', 'name email avatar')
        .populate('courseId', 'title slug thumbnail')
        .lean<PopulatedRecentEnrollment[]>(),
      // Revenue: total, this month, last month — completed payments only.
      Payment.aggregate<{ total: number; thisMonth: number; lastMonth: number }>([
        { $match: completedForCourses },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            thisMonth: {
              $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, '$amount', 0] },
            },
            lastMonth: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$createdAt', lastMonthStart] },
                      { $lt: ['$createdAt', monthStart] },
                    ],
                  },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
      ]),
      Payment.aggregate<{ _id: { year: number; month: number }; revenue: number }>([
        { $match: { ...completedForCourses, createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$amount' },
          },
        },
      ]),
      Payment.aggregate<{ _id: Types.ObjectId; revenue: number }>([
        { $match: completedForCourses },
        { $group: { _id: '$courseId', revenue: { $sum: '$amount' } } },
      ]),
      Enrollment.aggregate<{ _id: Types.ObjectId; total: number; completed: number }>([
        { $match: { tenantId: tenantOid, courseId: { $in: courseIds } } },
        {
          $group: {
            _id: '$courseId',
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $gte: ['$progress.percentage', 100] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const avgRating = reviewAgg[0]?.avgRating ?? 0;
    const totalReviews = reviewAgg[0]?.count ?? 0;

    const totalRevenue = centsToDollars(revenueTotals[0]?.total ?? 0);
    const monthlyRevenue = centsToDollars(revenueTotals[0]?.thisMonth ?? 0);
    const lastMonthRevenue = centsToDollars(revenueTotals[0]?.lastMonth ?? 0);
    const revenueGrowth =
      lastMonthRevenue === 0
        ? monthlyRevenue > 0
          ? 100
          : 0
        : Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

    const revenueByMonthKey = new Map(
      revenueByMonthRaw.map((r) => [`${r._id.year}-${r._id.month}`, centsToDollars(r.revenue)]),
    );
    const revenueByCourse = new Map(
      revenueByCourseRaw.map((r) => [r._id.toString(), centsToDollars(r.revenue)]),
    );
    const completionByCourse = new Map(
      completionByCourseRaw.map((r) => [
        r._id.toString(),
        r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0,
      ]),
    );

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const enrollByMonthRaw = await Enrollment.aggregate<{
      _id: { year: number; month: number };
      enrollments: number;
    }>([
      {
        $match: {
          tenantId: tenantOid,
          courseId: { $in: courseIds },
          enrolledAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$enrolledAt' }, month: { $month: '$enrolledAt' } },
          enrollments: { $sum: 1 },
        },
      },
    ]);
    const enrollByMonthKey = new Map(
      enrollByMonthRaw.map((r) => [`${r._id.year}-${r._id.month}`, r.enrollments]),
    );

    // Zero-filled 12-month chart with real revenue + enrollment series.
    const revenueChart: { month: string; revenue: number; enrollments: number }[] = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      revenueChart.push({
        month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        revenue: revenueByMonthKey.get(key) ?? 0,
        enrollments: enrollByMonthKey.get(key) ?? 0,
      });
    }

    const topCourseData = await Enrollment.aggregate<{ courseId: Types.ObjectId; enrollments: number }>([
      { $match: { tenantId: tenantOid, courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', enrollments: { $sum: 1 } } },
      { $sort: { enrollments: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, courseId: '$_id', enrollments: 1 } },
    ]);

    const courseById = new Map(courses.map((c) => [c._id.toString(), c]));
    const topCourses = topCourseData.map((d) => {
      const id = d.courseId.toString();
      return {
        course: courseById.get(id),
        enrollments: d.enrollments,
        revenue: revenueByCourse.get(id) ?? 0,
        completionRate: completionByCourse.get(id) ?? 0,
        averageRating: courseById.get(id)?.rating.average ?? 0,
      };
    });

    const recentEnrollments = recentEnrollRaw.map((e) => ({
      student: e.userId ?? { name: 'Unknown', email: '' },
      course: e.courseId ?? { title: 'Unknown', slug: '' },
      enrolledAt: e.enrolledAt,
    }));

    return {
      overview: {
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
        totalStudents: totalEnrollments,
        newStudentsThisMonth: monthEnrollments,
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.isPublished).length,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews,
      },
      revenueChart,
      topCourses,
      recentEnrollments,
      // Retained for callers that key off month-over-month enrollment growth.
      enrollmentGrowth:
        lastMonthEnrollments === 0
          ? monthEnrollments > 0
            ? 100
            : 0
          : Math.round(((monthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100),
    };
  },

  /** Per-instructor revenue from completed payments on their courses. */
  async instructorRevenue(tenantId: string, instructorId: string) {
    const tenantOid = new Types.ObjectId(tenantId);
    const courses = await Course.find({ tenantId, instructorId }).select('_id title').lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        availablePayout: 0,
        revenueByMonth: [],
        revenueByCourse: [],
        transactions: [],
      };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const completed = { tenantId: tenantOid, courseId: { $in: courseIds }, status: 'completed' } as const;

    const [totals, byMonthRaw, byCourseRaw, transactions] = await Promise.all([
      Payment.aggregate<{ total: number; thisMonth: number }>([
        { $match: completed },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', monthStart] }, '$amount', 0] } },
          },
        },
      ]),
      Payment.aggregate<{ _id: { year: number; month: number }; oneTime: number; subscription: number }>([
        { $match: { ...completed, createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            oneTime: { $sum: { $cond: [{ $eq: ['$type', 'one-time'] }, '$amount', 0] } },
            subscription: { $sum: { $cond: [{ $eq: ['$type', 'subscription'] }, '$amount', 0] } },
          },
        },
      ]),
      Payment.aggregate<{ _id: Types.ObjectId; revenue: number }>([
        { $match: completed },
        { $group: { _id: '$courseId', revenue: { $sum: '$amount' } } },
      ]),
      Payment.find(completed)
        .sort({ createdAt: -1 })
        .limit(20)
        .select('amount currency type createdAt courseId')
        .lean(),
    ]);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const byMonthKey = new Map(byMonthRaw.map((r) => [`${r._id.year}-${r._id.month}`, r]));
    const revenueByMonth: { month: string; oneTime: number; subscription: number }[] = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const row = byMonthKey.get(`${d.getFullYear()}-${d.getMonth() + 1}`);
      revenueByMonth.push({
        month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        oneTime: centsToDollars(row?.oneTime ?? 0),
        subscription: centsToDollars(row?.subscription ?? 0),
      });
    }

    const courseTitle = new Map(courses.map((c) => [c._id.toString(), c.title]));
    const revenueByCourse = byCourseRaw.map((r) => ({
      course: { _id: r._id.toString(), title: courseTitle.get(r._id.toString()) ?? 'Unknown' },
      revenue: centsToDollars(r.revenue),
    }));

    const totalRevenue = centsToDollars(totals[0]?.total ?? 0);
    return {
      totalRevenue,
      monthlyRevenue: centsToDollars(totals[0]?.thisMonth ?? 0),
      // Gross earned revenue is the payout basis (no separate instructor-payout ledger yet).
      availablePayout: totalRevenue,
      revenueByMonth,
      revenueByCourse,
      transactions: transactions.map((t) => ({
        amount: centsToDollars(t.amount),
        currency: t.currency,
        type: t.type,
        courseId: t.courseId?.toString() ?? null,
        date: t.createdAt,
      })),
    };
  },

  /** Per-instructor student list. */
  async instructorStudents(
    tenantId: string,
    instructorId: string,
    query: { courseId?: string; q?: string; page: number; limit: number },
  ) {
    const tenantOid = new Types.ObjectId(tenantId);
    const instructorOid = new Types.ObjectId(instructorId);

    const courseFilter: Record<string, unknown> = { tenantId: tenantOid, instructorId: instructorOid };
    if (query.courseId) courseFilter._id = new Types.ObjectId(query.courseId);

    const courses = await Course.find(courseFilter).select('_id').lean();
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) return { items: [], total: 0 };

    const enrollFilter: Record<string, unknown> = {
      tenantId: tenantOid,
      courseId: { $in: courseIds },
    };

    const skip = (query.page - 1) * query.limit;
    const [enrollments, total] = await Promise.all([
      Enrollment.find(enrollFilter)
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('userId', 'name email avatar')
        .populate('courseId', 'title slug thumbnail')
        .lean(),
      Enrollment.countDocuments(enrollFilter),
    ]);

    return { items: enrollments, total };
  },
};
