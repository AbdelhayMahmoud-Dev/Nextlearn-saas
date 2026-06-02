import { LiveSession } from '../models/LiveSession.model';
import { Enrollment } from '../models/Enrollment.model';
import { Course } from '../models/Course.model';

export const LiveSessionService = {
  /** Upcoming scheduled live sessions for the user's enrolled courses. */
  async upcomingForUser(tenantId: string, userId: string) {
    const enrollments = await Enrollment.find({ tenantId, userId, status: 'active' })
      .select('courseId')
      .lean();
    const courseIds = enrollments.map((e) => e.courseId);
    if (courseIds.length === 0) return [];

    const sessions = await LiveSession.find({
      tenantId,
      courseId: { $in: courseIds },
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
    })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean();

    const courses = await Course.find({ _id: { $in: sessions.map((s) => s.courseId) } })
      .select('title slug')
      .lean();
    const byId = new Map(courses.map((c) => [c._id.toString(), c]));
    return sessions.map((s) => ({ ...s, course: byId.get(s.courseId.toString()) }));
  },
};
