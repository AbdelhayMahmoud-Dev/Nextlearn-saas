import { FilterQuery, Types } from 'mongoose';
import { User, IUser, UserRole } from '../models/User.model';
import { Enrollment } from '../models/Enrollment.model';
import { Payment } from '../models/Payment.model';
import { Certificate } from '../models/Certificate.model';
import { Course } from '../models/Course.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';

const SAFE_FIELDS = '-password -refreshTokens -verificationToken -passwordResetToken';

interface ListFilters {
  page?: unknown;
  limit?: unknown;
  role?: string;
  search?: string;
  isActive?: string;
}

export const AdminUserService = {
  /** Paginated user list with enrollment counts (password/tokens never returned). */
  async listUsers(tenantId: string, filters: ListFilters) {
    const { page, limit, skip } = getPagination(filters, 100);
    const query: FilterQuery<IUser> = { tenantId };
    if (filters.role) query.role = filters.role as UserRole;
    if (filters.isActive === 'true') query.isActive = true;
    if (filters.isActive === 'false') query.isActive = false;
    if (filters.search) {
      const rx = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: rx }, { email: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(query).select(SAFE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    const ids = users.map((u) => u._id);
    const counts = await Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { userId: { $in: ids } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const items = users.map((u) => ({ ...u, enrollmentCount: countMap.get(u._id.toString()) ?? 0 }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Full user detail: profile + enrollments (with course), payments, certificates. */
  async getUser(tenantId: string, userId: string) {
    const user = await User.findOne({ _id: userId, tenantId }).select(SAFE_FIELDS).lean();
    if (!user) throw ApiError.notFound('User not found');

    const [enrollments, payments, certificates] = await Promise.all([
      Enrollment.find({ tenantId, userId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ tenantId, userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Certificate.find({ tenantId, userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const courseIds = enrollments.map((e) => e.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select('title slug thumbnail')
      .lean();
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));
    const enrollmentsWithCourse = enrollments.map((e) => ({
      ...e,
      course: courseMap.get(e.courseId.toString()) ?? null,
    }));

    return { user, enrollments: enrollmentsWithCourse, payments, certificates };
  },

  /** Changes a user's role. Cannot self-demote; cannot grant superadmin. */
  async changeRole(
    tenantId: string,
    requestingUserId: string,
    targetUserId: string,
    role: 'student' | 'instructor' | 'admin',
  ) {
    if (targetUserId === requestingUserId && role !== 'admin') {
      throw ApiError.badRequest('You cannot change your own admin role');
    }
    const user = await User.findOneAndUpdate(
      { _id: targetUserId, tenantId },
      { $set: { role } },
      { new: true },
    )
      .select(SAFE_FIELDS)
      .lean();
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  /** Activates/deactivates a user (deactivated users are blocked at auth). */
  async toggleStatus(
    tenantId: string,
    requestingUserId: string,
    targetUserId: string,
    isActive: boolean,
  ) {
    if (targetUserId === requestingUserId && !isActive) {
      throw ApiError.badRequest('You cannot deactivate your own account');
    }
    const user = await User.findOneAndUpdate(
      { _id: targetUserId, tenantId },
      { $set: { isActive } },
      { new: true },
    )
      .select(SAFE_FIELDS)
      .lean();
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  /** Soft-deletes a user: deactivate + anonymize PII (kept for audit trail). */
  async deleteUser(tenantId: string, requestingUserId: string, targetUserId: string): Promise<void> {
    if (targetUserId === requestingUserId) {
      throw ApiError.badRequest('You cannot delete your own account');
    }
    const result = await User.updateOne(
      { _id: targetUserId, tenantId },
      {
        $set: {
          isActive: false,
          name: 'Deleted User',
          email: `deleted+${targetUserId}@nextlearn.invalid`,
          avatar: undefined,
          bio: undefined,
          refreshTokens: [],
        },
      },
    );
    if (result.matchedCount === 0) throw ApiError.notFound('User not found');
  },

  /** Builds a CSV export of all users in the tenant. */
  async exportCsv(tenantId: string): Promise<string> {
    const users = await User.find({ tenantId })
      .select('name email role enrollments lastLogin createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const escape = (v: string): string => `"${v.replace(/"/g, '""')}"`;
    const header = 'Name,Email,Role,Enrollments,Last Login,Joined';
    const rows = users.map((u) =>
      [
        escape(u.name),
        escape(u.email),
        u.role,
        u.enrollments?.length ?? 0,
        u.lastLogin ? new Date(u.lastLogin).toISOString() : '',
        new Date(u.createdAt).toISOString(),
      ].join(','),
    );
    return [header, ...rows].join('\n');
  },
};
