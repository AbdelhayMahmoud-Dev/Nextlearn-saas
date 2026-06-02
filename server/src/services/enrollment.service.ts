import { Types } from 'mongoose';
import { Enrollment, IEnrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { User } from '../models/User.model';
import { Lesson } from '../models/Lesson.model';
import { Subscription } from '../models/Subscription.model';
import { ApiError } from '../utils/ApiError';
import { NotificationService } from './notification.service';

/** Result of an access check — the boolean plus a human-readable reason. */
export interface AccessResult {
  hasAccess: boolean;
  reason: string;
}

/** True if an enrollment is currently usable (active and not past any expiry). */
function isEnrollmentUsable(e: { status: string; expiresAt?: Date | null }): boolean {
  if (e.status !== 'active') return false;
  return !e.expiresAt || e.expiresAt.getTime() > Date.now();
}

/** True if a subscription currently grants access. */
function isSubscriptionUsable(s: { status: string; currentPeriodEnd?: Date | null }): boolean {
  if (s.status !== 'active' && s.status !== 'trialing') return false;
  return !s.currentPeriodEnd || s.currentPeriodEnd.getTime() > Date.now();
}

export const EnrollmentService = {
  /**
   * Enrolls a user in a course. Idempotent (returns the existing enrollment if
   * present). Paid courses require Stripe checkout (deferred) → 402.
   */
  async enroll(tenantId: string, userId: string, courseId: string): Promise<IEnrollment> {
    const course = await Course.findOne({ _id: courseId, tenantId, isPublished: true })
      .select('price title slug')
      .lean<{ _id: Types.ObjectId; price: number; title: string; slug: string } | null>();
    if (!course) throw ApiError.notFound('Course not found');

    const existing = await Enrollment.findOne({ tenantId, userId, courseId });
    if (existing) return existing.toObject();

    if (course.price > 0) {
      throw new ApiError(402, 'This course requires payment. Checkout is coming soon.');
    }

    const enrollment = await Enrollment.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      status: 'active',
      progress: { completedLessons: [], percentage: 0 },
      enrolledAt: new Date(),
    });

    await Promise.all([
      Course.updateOne({ _id: courseId }, { $inc: { enrolledCount: 1 } }),
      User.updateOne({ _id: userId }, { $addToSet: { enrollments: enrollment._id } }),
      NotificationService.create(tenantId, userId, {
        type: 'enrollment',
        title: `You're enrolled in “${course.title}”`,
        body: 'Start learning anytime from My Courses.',
        link: `/courses/${course.slug}`,
      }),
    ]);

    return enrollment.toObject();
  },

  /** Lists the user's enrollments with a lightweight populated course. */
  async listMy(tenantId: string, userId: string) {
    const enrollments = await Enrollment.find({ tenantId, userId }).sort({ updatedAt: -1 }).lean();
    const courses = await Course.find({ _id: { $in: enrollments.map((e) => e.courseId) } })
      .select('title slug thumbnail category level totalLessons totalDuration rating instructorId')
      .lean();
    const byId = new Map(courses.map((c) => [c._id.toString(), c]));
    return enrollments.map((e) => ({ ...e, course: byId.get(e.courseId.toString()) }));
  },

  /** Returns the user's enrollment for a course, or null (used for access checks). */
  async getEnrollment(tenantId: string, userId: string, courseId: string) {
    return Enrollment.findOne({ tenantId, userId, courseId }).lean();
  },

  /** Lightweight enrollment status for a course (drives the detail-page CTA). */
  async getStatus(tenantId: string, userId: string, courseId: string) {
    const enrollment = await Enrollment.findOne({ tenantId, userId, courseId })
      .select('status progress')
      .lean();
    return {
      isEnrolled: Boolean(enrollment),
      status: enrollment?.status ?? null,
      progress: enrollment?.progress ?? null,
      enrollmentId: enrollment?._id ?? null,
    };
  },

  /**
   * Enrolls in a FREE course (skips payment). Throws 400 for paid courses.
   */
  async enrollFree(tenantId: string, userId: string, courseId: string): Promise<IEnrollment> {
    const course = await Course.findOne({ _id: courseId, tenantId, isPublished: true })
      .select('price')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');
    if (course.price > 0) {
      throw ApiError.badRequest('This course is paid — please complete checkout to enroll');
    }
    return this.createEnrollment(tenantId, userId, courseId);
  },

  /**
   * Creates an enrollment after a payment is confirmed (or for a free course).
   * Idempotent: webhooks may retry, so an existing enrollment is re-activated
   * rather than duplicated (the unique {userId,courseId} index also protects us).
   */
  async createEnrollment(
    tenantId: string,
    userId: string,
    courseId: string,
    paymentId?: string,
  ): Promise<IEnrollment> {
    const course = await Course.findOne({ _id: courseId, tenantId })
      .select('title slug')
      .lean<{ _id: Types.ObjectId; title: string; slug: string } | null>();
    if (!course) throw ApiError.notFound('Course not found');

    const existing = await Enrollment.findOne({ tenantId, userId, courseId });
    if (existing) {
      // Re-activate (e.g. re-purchase after a refund); never double-count.
      const wasActive = existing.status === 'active';
      existing.status = 'active';
      if (paymentId) existing.paymentId = new Types.ObjectId(paymentId);
      await existing.save();
      if (!wasActive) {
        await Course.updateOne({ _id: courseId }, { $inc: { enrolledCount: 1 } });
      }
      return existing.toObject();
    }

    const enrollment = await Enrollment.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      paymentId: paymentId ? new Types.ObjectId(paymentId) : undefined,
      status: 'active',
      progress: { completedLessons: [], percentage: 0 },
      enrolledAt: new Date(),
    });

    await Promise.all([
      Course.updateOne({ _id: courseId }, { $inc: { enrolledCount: 1 } }),
      User.updateOne({ _id: userId }, { $addToSet: { enrollments: enrollment._id } }),
      NotificationService.create(tenantId, userId, {
        type: 'enrollment',
        title: 'Enrollment confirmed',
        body: `You are now enrolled in “${course.title}”.`,
        link: `/courses/${course.slug}`,
      }),
    ]);

    return enrollment.toObject();
  },

  /**
   * Determines whether a user can access a course's content.
   * Grants access if ANY of: lesson is free, active enrollment, active
   * subscription, or the user is an admin / the course's instructor.
   */
  async checkAccess(
    tenantId: string,
    userId: string,
    courseId: string,
    lessonId?: string,
  ): Promise<AccessResult> {
    const [user, course] = await Promise.all([
      User.findOne({ _id: userId, tenantId }).select('role').lean(),
      Course.findOne({ _id: courseId, tenantId }).select('instructorId').lean(),
    ]);
    if (!course) return { hasAccess: false, reason: 'course_not_found' };

    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      return { hasAccess: true, reason: 'admin' };
    }
    if (course.instructorId.toString() === userId) {
      return { hasAccess: true, reason: 'instructor' };
    }

    if (lessonId) {
      const lesson = await Lesson.findOne({ _id: lessonId, courseId, tenantId })
        .select('isFree')
        .lean();
      if (lesson?.isFree) return { hasAccess: true, reason: 'free_lesson' };
    }

    const enrollment = await Enrollment.findOne({ tenantId, userId, courseId })
      .select('status expiresAt')
      .lean();
    if (enrollment && isEnrollmentUsable(enrollment)) {
      return { hasAccess: true, reason: 'enrolled' };
    }

    const subscription = await Subscription.findOne({ tenantId, userId })
      .select('status currentPeriodEnd')
      .sort({ createdAt: -1 })
      .lean();
    if (subscription && isSubscriptionUsable(subscription)) {
      return { hasAccess: true, reason: 'subscription' };
    }

    return { hasAccess: false, reason: 'no_access' };
  },

  /** Marks an enrollment refunded when its payment is refunded (webhook). */
  async refundEnrollment(paymentId: string): Promise<void> {
    const enrollment = await Enrollment.findOne({ paymentId });
    if (!enrollment) return;
    if (enrollment.status === 'refunded') return; // idempotent
    enrollment.status = 'refunded';
    await enrollment.save();
    await Course.updateOne(
      { _id: enrollment.courseId, enrolledCount: { $gt: 0 } },
      { $inc: { enrolledCount: -1 } },
    );
    await NotificationService.create(
      enrollment.tenantId.toString(),
      enrollment.userId.toString(),
      {
        type: 'payment',
        title: 'Refund processed',
        body: 'Your enrollment has been refunded and access removed.',
      },
    );
  },
};
