import { Types } from 'mongoose';
import { Review, IReview } from '../models/Review.model';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { CreateReviewInput } from '../validations/review.validation';

type LeanReview = IReview & { _id: Types.ObjectId };

async function attachAuthors(reviews: LeanReview[]) {
  const users = await User.find({ _id: { $in: reviews.map((r) => r.userId) } })
    .select('name avatar')
    .lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return reviews.map((r) => ({ ...r, user: byId.get(r.userId.toString()) }));
}

export const ReviewService = {
  /** Top reviews across the tenant — powers homepage testimonials. */
  async featured(tenantId: string) {
    const reviews = await Review.find({ tenantId, rating: { $gte: 4 }, comment: { $nin: [null, ''] } })
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .lean<LeanReview[]>();
    const withUsers = await attachAuthors(reviews);
    const courses = await Course.find({ _id: { $in: reviews.map((r) => r.courseId) } })
      .select('title slug')
      .lean();
    const byId = new Map(courses.map((c) => [c._id.toString(), c]));
    return withUsers.map((r) => ({ ...r, course: byId.get(r.courseId.toString()) }));
  },

  async forCourse(tenantId: string, courseId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = getPagination(query, 20);
    const [items, total] = await Promise.all([
      Review.find({ tenantId, courseId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<LeanReview[]>(),
      Review.countDocuments({ tenantId, courseId }),
    ]);
    return { items: await attachAuthors(items), meta: buildPaginationMeta(total, page, limit) };
  },

  /** Creates/updates the user's review and recomputes the course's rating. */
  async create(tenantId: string, userId: string, input: CreateReviewInput) {
    const enrolled = await Enrollment.exists({ tenantId, userId, courseId: input.courseId });
    const review = await Review.findOneAndUpdate(
      { tenantId, userId, courseId: input.courseId },
      { $set: { rating: input.rating, comment: input.comment ?? '', isVerified: Boolean(enrolled) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const [agg] = await Review.aggregate<{ avg: number; count: number }>([
      { $match: { courseId: new Types.ObjectId(input.courseId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Course.updateOne(
      { _id: input.courseId },
      { $set: { 'rating.average': Math.round((agg?.avg ?? 0) * 10) / 10, 'rating.count': agg?.count ?? 0 } },
    );

    return review.toObject();
  },
};
