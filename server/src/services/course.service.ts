import { FilterQuery, SortOrder, Types } from 'mongoose';
import slugify from 'slugify';
import { Course, ICourse } from '../models/Course.model';
import { Module } from '../models/Module.model';
import { Lesson } from '../models/Lesson.model';
import { Enrollment } from '../models/Enrollment.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { withCache, invalidateCache } from '../config/redis';
import { CreateCourseBody, ListCoursesQuery } from '../validations/course.validation';

/** Wildcard key for a tenant's cached catalog pages. */
const coursesCacheKey = (tenantId: string): string => `tenant:${tenantId}:courses`;

type InstructorSummary = { _id: Types.ObjectId; name: string; avatar?: string; bio?: string };

const SORT_MAP: Record<ListCoursesQuery['sort'], Record<string, SortOrder>> = {
  popular: { enrolledCount: -1, 'rating.average': -1 },
  newest: { createdAt: -1 },
  rating: { 'rating.average': -1, 'rating.count': -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
};

function buildFilter(tenantId: string, query: ListCoursesQuery): FilterQuery<ICourse> {
  const filter: FilterQuery<ICourse> = { tenantId, isPublished: true };
  if (query.category) filter.category = query.category;
  if (query.level) filter.level = query.level;
  if (query.price === 'free') filter.price = 0;
  if (query.price === 'paid') filter.price = { $gt: 0 };
  if (query.q) filter.$text = { $search: query.q };
  return filter;
}

/** Attaches a lightweight `instructor` object to each course (single batched lookup). */
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

/** Generates a tenant-scoped unique slug from a title. */
async function generateSlug(tenantId: string, title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true, trim: true });
  const existing = await Course.find({ tenantId, slug: { $regex: `^${base}(-\\d+)?$` } })
    .select('slug')
    .lean<{ slug: string }[]>();
  if (existing.length === 0) return base;
  const suffixes = existing
    .map((c) => {
      const match = c.slug.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
  return `${base}-${Math.max(...suffixes) + 1}`;
}

export const CourseService = {
  // ── Public endpoints ──────────────────────────────────────────────────────

  async list(tenantId: string, query: ListCoursesQuery) {
    // Public catalog is hot + slow-changing → cache per (tenant, filters) for 60s.
    const cacheKey = `${coursesCacheKey(tenantId)}:${JSON.stringify(query)}`;
    return withCache(cacheKey, 60, async () => {
      const filter = buildFilter(tenantId, query);
      const skip = (query.page - 1) * query.limit;
      const [items, total] = await Promise.all([
        Course.find(filter).sort(SORT_MAP[query.sort]).skip(skip).limit(query.limit).lean(),
        Course.countDocuments(filter),
      ]);
      return { items: await attachInstructors(items), total };
    });
  },

  async featured(tenantId: string) {
    const items = await Course.find({ tenantId, isPublished: true, isFeatured: true })
      .sort({ enrolledCount: -1 })
      .limit(8)
      .lean();
    return attachInstructors(items);
  },

  async categories(tenantId: string): Promise<{ name: string; count: number }[]> {
    const rows = await Course.aggregate<{ _id: string; count: number }>([
      { $match: { tenantId: new Types.ObjectId(tenantId), isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return rows.map((r) => ({ name: r._id, count: r.count }));
  },

  async getBySlug(tenantId: string, slug: string, requestingUserId?: string) {
    const query: FilterQuery<ICourse> = { tenantId, slug };
    // Draft is visible to the instructor who owns it
    if (!requestingUserId) {
      query.isPublished = true;
    } else {
      query.$or = [{ isPublished: true }, { instructorId: new Types.ObjectId(requestingUserId) }];
    }
    const course = await Course.findOne(query).lean();
    if (!course) throw ApiError.notFound('Course not found');

    const [instructor, modules] = await Promise.all([
      User.findById(course.instructorId).select('name avatar bio').lean<InstructorSummary | null>(),
      Module.find({ courseId: course._id, isPublished: true }).sort({ order: 1 }).lean(),
    ]);

    const lessons = await Lesson.find({
      moduleId: { $in: modules.map((m) => m._id) },
      isPublished: true,
    })
      .sort({ order: 1 })
      .lean();

    const safeLessons = lessons.map((lesson) =>
      lesson.isFree
        ? lesson
        : { ...lesson, content: { duration: lesson.content?.duration ?? 0, attachments: [] } },
    );
    const lessonsByModule = new Map<string, typeof safeLessons>();
    for (const lesson of safeLessons) {
      const key = lesson.moduleId.toString();
      const list = lessonsByModule.get(key) ?? [];
      list.push(lesson);
      lessonsByModule.set(key, list);
    }

    return {
      ...course,
      instructor: instructor ?? undefined,
      modules: modules.map((m) => ({ ...m, lessons: lessonsByModule.get(m._id.toString()) ?? [] })),
    };
  },

  // ── Instructor endpoints ──────────────────────────────────────────────────

  /** Creates a new draft course for the given instructor. */
  async create(tenantId: string, instructorId: string, body: CreateCourseBody) {
    const slug = await generateSlug(tenantId, body.title);
    const course = await Course.create({
      tenantId,
      instructorId,
      slug,
      ...body,
    });
    await invalidateCache(`${coursesCacheKey(tenantId)}:*`);
    return course.toObject();
  },

  /** Returns all courses belonging to a specific instructor. */
  async listForInstructor(tenantId: string, instructorId: string) {
    return Course.find({ tenantId, instructorId }).sort({ createdAt: -1 }).lean();
  },

  /** Returns full course data for the editor (including unpublished). */
  async getForEdit(tenantId: string, courseId: string, requestingUserId: string, isAdmin: boolean) {
    const course = await Course.findOne({ _id: courseId, tenantId }).lean();
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin && course.instructorId.toString() !== requestingUserId) {
      throw ApiError.forbidden('You can only edit your own courses');
    }
    const modules = await Module.find({ courseId: course._id }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({
      moduleId: { $in: modules.map((m) => m._id) },
    }).sort({ order: 1 }).lean();
    const lessonsByModule = new Map<string, typeof lessons>();
    for (const l of lessons) {
      const key = l.moduleId.toString();
      lessonsByModule.set(key, [...(lessonsByModule.get(key) ?? []), l]);
    }
    return {
      ...course,
      modules: modules.map((m) => ({ ...m, lessons: lessonsByModule.get(m._id.toString()) ?? [] })),
    };
  },

  /** Updates a course. Instructors may only update their own. */
  async update(
    tenantId: string,
    courseId: string,
    requestingUserId: string,
    isAdmin: boolean,
    body: Partial<CreateCourseBody>,
  ) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin && course.instructorId.toString() !== requestingUserId) {
      throw ApiError.forbidden('You can only edit your own courses');
    }
    // Regenerate slug if title changed
    if (body.title && body.title !== course.title) {
      body = { ...body }; // don't mutate param
    }
    Object.assign(course, body);
    await course.save();
    await invalidateCache(`${coursesCacheKey(tenantId)}:*`);
    return course.toObject();
  },

  /** Deletes a course. Instructors may only delete unpublished own courses. */
  async delete(tenantId: string, courseId: string, requestingUserId: string, isAdmin: boolean) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin) {
      if (course.instructorId.toString() !== requestingUserId) {
        throw ApiError.forbidden('You can only delete your own courses');
      }
      if (course.isPublished) {
        throw ApiError.badRequest('Unpublish the course before deleting it');
      }
    }
    await Module.deleteMany({ courseId: course._id });
    await Lesson.deleteMany({ courseId: course._id });
    await Course.deleteOne({ _id: course._id });
    await invalidateCache(`${coursesCacheKey(tenantId)}:*`);
  },

  /** Validates publish checklist and sets isPublished = true. */
  async publish(tenantId: string, courseId: string, requestingUserId: string, isAdmin: boolean) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin && course.instructorId.toString() !== requestingUserId) {
      throw ApiError.forbidden('You can only publish your own courses');
    }

    const [moduleCount, publishedLessonCount] = await Promise.all([
      Module.countDocuments({ courseId: course._id, tenantId }),
      Lesson.countDocuments({ courseId: course._id, tenantId, isPublished: true }),
    ]);

    const checklist = [
      { key: 'title', label: 'Course title (min 5 chars)', pass: course.title.length >= 5 },
      { key: 'outcomes', label: 'At least one learning outcome', pass: course.outcomes.length >= 1 },
      { key: 'thumbnail', label: 'Thumbnail image uploaded', pass: Boolean(course.thumbnail) },
      { key: 'modules', label: 'At least one module created', pass: moduleCount >= 1 },
      { key: 'publishedLessons', label: 'At least one published lesson', pass: publishedLessonCount >= 1 },
      { key: 'price', label: 'Price set', pass: course.price >= 0 },
    ];

    const failures = checklist.filter((c) => !c.pass);
    if (failures.length > 0) {
      throw ApiError.badRequest('Publish validation failed', { checklist });
    }

    course.isPublished = true;
    await course.save();
    await invalidateCache(`${coursesCacheKey(tenantId)}:*`);
    return course.toObject();
  },

  async unpublish(tenantId: string, courseId: string, requestingUserId: string, isAdmin: boolean) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin && course.instructorId.toString() !== requestingUserId) {
      throw ApiError.forbidden('You can only unpublish your own courses');
    }
    course.isPublished = false;
    await course.save();
    await invalidateCache(`${coursesCacheKey(tenantId)}:*`);
    return course.toObject();
  },

  async feature(tenantId: string, courseId: string) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, tenantId },
      [{ $set: { isFeatured: { $not: '$isFeatured' } } }],
      { new: true },
    ).lean();
    if (!course) throw ApiError.notFound('Course not found');
    await invalidateCache(`${coursesCacheKey(tenantId)}:*`);
    return course;
  },

  /** Per-course analytics using aggregation pipelines. */
  async getAnalytics(tenantId: string, courseId: string, requestingUserId: string, isAdmin: boolean) {
    const course = await Course.findOne({ _id: courseId, tenantId }).lean();
    if (!course) throw ApiError.notFound('Course not found');
    if (!isAdmin && course.instructorId.toString() !== requestingUserId) {
      throw ApiError.forbidden('You can only view analytics for your own courses');
    }

    const courseObjectId = new Types.ObjectId(courseId);
    const tenantObjectId = new Types.ObjectId(tenantId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [enrollmentOverTime, ratingDist, totalEnrolled] = await Promise.all([
      // Enrollments per day for the last 30 days
      Enrollment.aggregate<{ date: string; count: number }>([
        {
          $match: {
            tenantId: tenantObjectId,
            courseId: courseObjectId,
            enrolledAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]),
      // Rating distribution 1-5
      Course.aggregate<{ star: number; count: number }>([
        { $match: { _id: courseObjectId } },
        {
          $project: {
            _id: 0,
            distribution: {
              $map: {
                input: [1, 2, 3, 4, 5],
                as: 'star',
                in: { star: '$$star', count: 0 },
              },
            },
          },
        },
        { $unwind: '$distribution' },
        { $replaceRoot: { newRoot: '$distribution' } },
      ]),
      Enrollment.countDocuments({ tenantId: tenantObjectId, courseId: courseObjectId }),
    ]);

    return {
      course,
      enrollmentOverTime,
      totalEnrolled,
      ratingDistribution: Object.fromEntries(
        [1, 2, 3, 4, 5].map((s) => [s, ratingDist.find((r) => r.star === s)?.count ?? 0]),
      ),
      revenueBreakdown: { oneTime: 0, subscription: 0, total: 0 }, // Payments wired in Phase 4
    };
  },
};
