import { Types } from 'mongoose';
import { Enrollment } from '../models/Enrollment.model';
import { Progress } from '../models/Progress.model';
import { Course } from '../models/Course.model';
import { Lesson } from '../models/Lesson.model';
import { Certificate } from '../models/Certificate.model';

const dayKey = (date: Date): string => date.toISOString().slice(0, 10);

export const DashboardService = {
  /** Aggregates the authenticated student's dashboard: stats, continue-learning,
   *  recent activity, and a 30-day completion chart. */
  async getStudentDashboard(tenantId: string, userId: string) {
    const tid = new Types.ObjectId(tenantId);
    const uid = new Types.ObjectId(userId);

    const [enrollments, progressRecords, certificatesCount] = await Promise.all([
      Enrollment.find({ tenantId, userId }).sort({ updatedAt: -1 }).lean(),
      Progress.find({ tenantId, userId }).lean(),
      Certificate.countDocuments({ tenantId, userId }),
    ]);

    const hoursLearned =
      Math.round((progressRecords.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / 3600) * 10) /
      10;

    // Current streak: consecutive days (ending today or yesterday) with a completion.
    const completedDays = new Set(
      progressRecords
        .filter((p) => p.isCompleted && p.completedAt)
        .map((p) => dayKey(new Date(p.completedAt as Date))),
    );
    let streakDays = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!completedDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (completedDays.has(dayKey(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const courses = await Course.find({ _id: { $in: enrollments.map((e) => e.courseId) } })
      .select('title slug thumbnail category totalLessons totalDuration rating instructorId')
      .lean();
    const courseById = new Map(courses.map((c) => [c._id.toString(), c]));

    const continueLearning = enrollments
      .filter((e) => e.progress.percentage < 100)
      .slice(0, 3)
      .map((e) => ({ ...e, course: courseById.get(e.courseId.toString()) }));

    // Recent activity: last 5 completed lessons with titles.
    const recentCompleted = progressRecords
      .filter((p) => p.isCompleted && p.completedAt)
      .sort((a, b) => new Date(b.completedAt as Date).getTime() - new Date(a.completedAt as Date).getTime())
      .slice(0, 5);
    const lessons = await Lesson.find({ _id: { $in: recentCompleted.map((p) => p.lessonId) } })
      .select('title')
      .lean();
    const lessonById = new Map(lessons.map((l) => [l._id.toString(), l]));
    const recentActivity = recentCompleted.map((p) => ({
      lessonTitle: lessonById.get(p.lessonId.toString())?.title ?? 'Lesson',
      courseTitle: courseById.get(p.courseId.toString())?.title ?? 'Course',
      courseSlug: courseById.get(p.courseId.toString())?.slug ?? '',
      completedAt: p.completedAt,
    }));

    // 30-day activity chart.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);
    const rows = await Progress.aggregate<{ _id: string; count: number }>([
      { $match: { tenantId: tid, userId: uid, isCompleted: true, completedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
    ]);
    const activityByDay = new Map(rows.map((r) => [r._id, r.count]));
    const activity: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      activity.push({ date: dayKey(d), count: activityByDay.get(dayKey(d)) ?? 0 });
    }

    return {
      stats: {
        enrolledCount: enrollments.length,
        hoursLearned,
        certificatesCount,
        streakDays,
      },
      continueLearning,
      recentActivity,
      activity,
    };
  },
};
