import { Types } from 'mongoose';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Review } from '../models/Review.model';

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

    const [totalEnrollments, monthEnrollments, lastMonthEnrollments, reviewAgg, recentEnrollRaw] =
      await Promise.all([
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
          .lean(),
      ]);

    const avgRating = reviewAgg[0]?.avgRating ?? 0;
    const totalReviews = reviewAgg[0]?.count ?? 0;
    const growthNumerator = lastMonthEnrollments === 0
      ? 0
      : ((monthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100;

    // Revenue chart: last 12 months enrollment counts (revenue wired in Phase 4)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const revenueChart = await Enrollment.aggregate<{ month: string; revenue: number; enrollments: number }>([
      {
        $match: {
          tenantId: tenantOid,
          courseId: { $in: courseIds },
          enrolledAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$enrolledAt' },
            month: { $month: '$enrolledAt' },
          },
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  { $subtract: ['$_id.month', 1] },
                ],
              },
              ' ',
              { $toString: '$_id.year' },
            ],
          },
          revenue: { $literal: 0 }, // Phase 4: wire to Payment collection
          enrollments: 1,
        },
      },
    ]);

    // Top courses by enrollment
    const topCourseData = await Enrollment.aggregate<{ courseId: Types.ObjectId; enrollments: number }>([
      { $match: { tenantId: tenantOid, courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', enrollments: { $sum: 1 } } },
      { $sort: { enrollments: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, courseId: '$_id', enrollments: 1 } },
    ]);

    const courseById = new Map(courses.map((c) => [c._id.toString(), c]));
    const topCourses = topCourseData.map((d) => ({
      course: courseById.get(d.courseId.toString()),
      enrollments: d.enrollments,
      revenue: 0, // Phase 4
      completionRate: 0, // Progress aggregation deferred
      averageRating: courseById.get(d.courseId.toString())?.rating.average ?? 0,
    }));

    const recentEnrollments = recentEnrollRaw.map((e) => ({
      student: e.userId as unknown as { name: string; email: string; avatar?: string },
      course: e.courseId as unknown as { title: string; slug: string; thumbnail?: string },
      enrolledAt: e.enrolledAt,
    }));

    return {
      overview: {
        totalRevenue: 0, // Phase 4
        monthlyRevenue: 0, // Phase 4
        revenueGrowth: Math.round(growthNumerator),
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
    };
  },

  /** Revenue breakdown — Phase 4 will wire to Payments. Returns zeroes for now. */
  async instructorRevenue(tenantId: string, instructorId: string) {
    const courses = await Course.find({ tenantId, instructorId }).select('_id title').lean();
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      availablePayout: 0,
      revenueByMonth: [],
      revenueByCourse: courses.map((c) => ({ course: c, revenue: 0 })),
      transactions: [],
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
