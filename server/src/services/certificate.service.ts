import { Types } from 'mongoose';
import { Certificate } from '../models/Certificate.model';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { NotificationService } from './notification.service';

export const CertificateService = {
  /**
   * Issues a certificate once a course is 100% complete. Idempotent (one cert
   * per user per course). Requires an active enrollment.
   */
  async generate(tenantId: string, userId: string, courseId: string) {
    const enrollment = await Enrollment.findOne({ tenantId, userId, courseId });
    if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course');
    if (enrollment.progress.percentage < 100) {
      throw ApiError.badRequest('Complete the course to earn your certificate');
    }

    const existing = await Certificate.findOne({ tenantId, userId, courseId });
    if (existing) return existing.toObject();

    const certificate = await Certificate.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      courseId: new Types.ObjectId(courseId),
      enrollmentId: enrollment._id,
      issuedAt: new Date(),
    });
    certificate.verificationUrl = `${env.CLIENT_URL}/verify/${certificate.certificateNumber}`;
    await certificate.save();
    await User.updateOne({ _id: userId }, { $addToSet: { certificates: certificate._id } });
    await NotificationService.create(tenantId, userId, {
      type: 'certificate',
      title: 'You earned a certificate! 🎓',
      body: 'View and download it from your certificates.',
      link: '/certificates',
    });

    return certificate.toObject();
  },

  /** The user's certificates with a lightweight populated course. */
  async listMy(tenantId: string, userId: string) {
    const certificates = await Certificate.find({ tenantId, userId }).sort({ issuedAt: -1 }).lean();
    const courses = await Course.find({ _id: { $in: certificates.map((c) => c.courseId) } })
      .select('title slug thumbnail')
      .lean();
    const byId = new Map(courses.map((c) => [c._id.toString(), c]));
    return certificates.map((c) => ({ ...c, course: byId.get(c.courseId.toString()) }));
  },

  /** Public verification by certificate number (globally unique UUID, no tenant scope). */
  async verify(certificateNumber: string) {
    const certificate = await Certificate.findOne({ certificateNumber }).lean();
    if (!certificate) return { valid: false as const };

    const [user, course] = await Promise.all([
      User.findById(certificate.userId).select('name').lean(),
      Course.findById(certificate.courseId).select('title').lean(),
    ]);

    return {
      valid: true as const,
      certificateNumber: certificate.certificateNumber,
      studentName: user?.name ?? 'Unknown',
      courseTitle: course?.title ?? 'Unknown course',
      issuedAt: certificate.issuedAt,
    };
  },
};
