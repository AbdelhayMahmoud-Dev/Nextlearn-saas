import { PipelineStage, Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { User } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { Review } from '../models/Review.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { withCache } from '../config/redis';

type InstructorSummary = { _id: Types.ObjectId; name: string; avatar?: string; bio?: string };

/** Public, published, approved courses only — the marketplace never leaks drafts. */
const PUBLIC_COURSE_FILTER = { isPublished: true, isApproved: true } as const;
const CARD_FIELDS =
  'title slug thumbnail category level price salePrice currency rating totalLessons totalDuration enrolledCount instructorId createdAt';

async function attachInstructors<T extends { instructorId: Types.ObjectId }>(
  courses: T[],
): Promise<(T & { instructor?: InstructorSummary })[]> {
  const ids = [...new Set(courses.map((c) => c.instructorId.toString()))];
  const instructors = await User.find({ _id: { $in: ids } })
    .select('name avatar bio')
    .lean<InstructorSummary[]>();
  const byId = new Map(instructors.map((u) => [u._id.toString(), u]));
  return courses.map((c) => {
    const instructor = byId.get(c.instructorId.toString());
    return instructor ? { ...c, instructor } : c;
  });
}

export const MarketplaceService = {
  /** Headline marketplace stats for the hero/landing area. */
  async stats(tenantId: string) {
    return withCache(`mkt:stats:${tenantId}`, 10 * 60, async () => {
      const tid = new Types.ObjectId(tenantId);
      const [courses, instructorIds, students, rating] = await Promise.all([
        Course.countDocuments({ tenantId: tid, ...PUBLIC_COURSE_FILTER }),
        Course.distinct('instructorId', { tenantId: tid, ...PUBLIC_COURSE_FILTER }),
        Enrollment.countDocuments({ tenantId: tid }),
        Course.aggregate<{ avg: number }>([
          { $match: { tenantId: tid, ...PUBLIC_COURSE_FILTER, 'rating.count': { $gt: 0 } } },
          { $group: { _id: null, avg: { $avg: '$rating.average' } } },
        ]),
      ]);
      return {
        courses,
        instructors: instructorIds.length,
        students,
        averageRating: Math.round((rating[0]?.avg ?? 0) * 10) / 10,
      };
    });
  },

  /** Featured courses (admin-flagged). */
  async featured(tenantId: string, limit = 8) {
    const courses = await Course.find({ tenantId, ...PUBLIC_COURSE_FILTER, isFeatured: true })
      .select(CARD_FIELDS)
      .sort({ 'rating.average': -1, enrolledCount: -1 })
      .limit(limit)
      .lean();
    return attachInstructors(courses);
  },

  /** Top-rated published courses (require at least one rating). */
  async topRated(tenantId: string, limit = 8) {
    const courses = await Course.find({
      tenantId,
      ...PUBLIC_COURSE_FILTER,
      'rating.count': { $gt: 0 },
    })
      .select(CARD_FIELDS)
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit)
      .lean();
    return attachInstructors(courses);
  },

  /** Trending: courses with the most enrollments in the last 30 days. */
  async trending(tenantId: string, limit = 8) {
    return withCache(`mkt:trending:${tenantId}:${limit}`, 5 * 60, async () => {
      const tid = new Types.ObjectId(tenantId);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const rows = await Enrollment.aggregate<{ _id: Types.ObjectId; recent: number }>([
        { $match: { tenantId: tid, createdAt: { $gte: since } } },
        { $group: { _id: '$courseId', recent: { $sum: 1 } } },
        { $sort: { recent: -1 } },
        { $limit: limit * 2 },
      ]);

      const ids = rows.map((r) => r._id);
      const courses = await Course.find({ _id: { $in: ids }, tenantId, ...PUBLIC_COURSE_FILTER })
        .select(CARD_FIELDS)
        .lean();
      const recentMap = new Map(rows.map((r) => [r._id.toString(), r.recent]));

      const ordered = courses
        .map((c) => ({ ...c, recentEnrollments: recentMap.get(c._id.toString()) ?? 0 }))
        .sort((a, b) => b.recentEnrollments - a.recentEnrollments)
        .slice(0, limit);
      return attachInstructors(ordered);
    });
  },

  /** Category breakdown (published courses only). */
  async categories(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    return Course.aggregate<{ category: string; count: number }>([
      { $match: { tenantId: tid, ...PUBLIC_COURSE_FILTER } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);
  },

  /**
   * Ranked, paginated directory of instructors with at least one published
   * course, with their course count, total students, and average rating.
   */
  async instructors(
    tenantId: string,
    query: { page?: unknown; limit?: unknown; search?: string },
  ) {
    const tid = new Types.ObjectId(tenantId);
    const { page, limit, skip } = getPagination(query, 12);

    const pipeline: PipelineStage[] = [
      { $match: { tenantId: tid, ...PUBLIC_COURSE_FILTER } },
      {
        $group: {
          _id: '$instructorId',
          courses: { $sum: 1 },
          students: { $sum: '$enrolledCount' },
          ratingSum: { $sum: { $multiply: ['$rating.average', '$rating.count'] } },
          ratingCount: { $sum: '$rating.count' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ];

    if (query.search) {
      const rx = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pipeline.push({ $match: { 'user.name': { $regex: rx, $options: 'i' } } });
    }

    pipeline.push({
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: '$user.name',
        avatar: '$user.avatar',
        bio: '$user.bio',
        courses: 1,
        students: 1,
        avgRating: {
          $cond: [
            { $gt: ['$ratingCount', 0] },
            { $round: [{ $divide: ['$ratingSum', '$ratingCount'] }, 1] },
            0,
          ],
        },
      },
    });

    const countResult = await Course.aggregate([...pipeline, { $count: 'total' }]);
    const total = (countResult[0] as { total?: number } | undefined)?.total ?? 0;

    const items = await Course.aggregate([
      ...pipeline,
      { $sort: { students: -1, avgRating: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Public instructor profile: bio, social links, stats, and published courses. */
  async instructorProfile(tenantId: string, instructorId: string) {
    if (!Types.ObjectId.isValid(instructorId)) throw ApiError.notFound('Instructor not found');
    const user = await User.findOne({ _id: instructorId, tenantId, role: 'instructor' })
      .select('name avatar bio socialLinks createdAt')
      .lean();
    if (!user) throw ApiError.notFound('Instructor not found');

    const courses = await Course.find({
      tenantId,
      instructorId,
      ...PUBLIC_COURSE_FILTER,
    })
      .select(CARD_FIELDS)
      .sort({ enrolledCount: -1 })
      .lean();

    const tid = new Types.ObjectId(tenantId);
    const iid = new Types.ObjectId(instructorId);
    const [students, ratingAgg, reviewCount] = await Promise.all([
      Enrollment.countDocuments({
        tenantId: tid,
        courseId: { $in: courses.map((c) => c._id) },
      }),
      Course.aggregate<{ sum: number; count: number }>([
        { $match: { tenantId: tid, instructorId: iid, ...PUBLIC_COURSE_FILTER } },
        {
          $group: {
            _id: null,
            sum: { $sum: { $multiply: ['$rating.average', '$rating.count'] } },
            count: { $sum: '$rating.count' },
          },
        },
      ]),
      Review.countDocuments({ tenantId: tid, courseId: { $in: courses.map((c) => c._id) } }),
    ]);

    const ratingCount = ratingAgg[0]?.count ?? 0;
    const avgRating = ratingCount > 0 ? Math.round((ratingAgg[0].sum / ratingCount) * 10) / 10 : 0;

    return {
      instructor: {
        id: user._id.toString(),
        name: user.name,
        avatar: user.avatar ?? null,
        bio: user.bio ?? null,
        socialLinks: user.socialLinks ?? null,
        memberSince: user.createdAt,
      },
      stats: {
        courses: courses.length,
        students,
        avgRating,
        reviews: reviewCount,
      },
      courses,
    };
  },

  /** Slugs of all public instructors + courses, for sitemap generation. */
  async sitemapEntries(tenantId: string) {
    const tid = new Types.ObjectId(tenantId);
    const [courses, instructorIds] = await Promise.all([
      Course.find({ tenantId: tid, ...PUBLIC_COURSE_FILTER })
        .select('slug updatedAt')
        .lean(),
      Course.distinct('instructorId', { tenantId: tid, ...PUBLIC_COURSE_FILTER }),
    ]);
    return {
      courses: courses.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt })),
      instructorIds: instructorIds.map((id) => id.toString()),
    };
  },
};
