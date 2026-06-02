import { FilterQuery, Types } from 'mongoose';
import { Payment, IPayment } from '../models/Payment.model';
import { Subscription, ISubscription } from '../models/Subscription.model';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, getPagination } from '../utils/pagination';

type UserLite = { _id: Types.ObjectId; name: string; email: string; avatar?: string };

interface PaymentFilters {
  page?: unknown;
  limit?: unknown;
  status?: string;
  type?: string;
  userId?: string;
  courseId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface SubFilters {
  page?: unknown;
  limit?: unknown;
  status?: string;
  plan?: string;
}

export const AdminPaymentService = {
  /** Paginated payments with user + course info. */
  async listPayments(tenantId: string, filters: PaymentFilters) {
    const { page, limit, skip } = getPagination(filters, 100);
    const query: FilterQuery<IPayment> = { tenantId };
    if (filters.status) query.status = filters.status as IPayment['status'];
    if (filters.type) query.type = filters.type as IPayment['type'];
    if (filters.userId) query.userId = new Types.ObjectId(filters.userId);
    if (filters.courseId) query.courseId = new Types.ObjectId(filters.courseId);
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {
        ...(filters.dateFrom ? { $gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { $lte: new Date(filters.dateTo) } : {}),
      };
    }

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query),
    ]);

    const userIds = [...new Set(payments.map((p) => p.userId.toString()))];
    const courseIds = [...new Set(payments.filter((p) => p.courseId).map((p) => p.courseId!.toString()))];
    const [users, courses] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('name email avatar').lean<UserLite[]>(),
      Course.find({ _id: { $in: courseIds } }).select('title slug').lean(),
    ]);
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const items = payments.map((p) => ({
      ...p,
      user: userMap.get(p.userId.toString()) ?? null,
      course: p.courseId ? courseMap.get(p.courseId.toString()) ?? null : null,
    }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  /** Single payment with user + course. */
  async getPayment(tenantId: string, paymentId: string) {
    const payment = await Payment.findOne({ _id: paymentId, tenantId }).lean();
    if (!payment) throw ApiError.notFound('Payment not found');
    const [user, course] = await Promise.all([
      User.findById(payment.userId).select('name email avatar').lean(),
      payment.courseId ? Course.findById(payment.courseId).select('title slug').lean() : null,
    ]);
    return { ...payment, user: user ?? null, course: course ?? null };
  },

  /** Paginated subscriptions with user info. */
  async listSubscriptions(tenantId: string, filters: SubFilters) {
    const { page, limit, skip } = getPagination(filters, 100);
    const query: FilterQuery<ISubscription> = { tenantId };
    if (filters.status) query.status = filters.status as ISubscription['status'];
    if (filters.plan) query.plan = filters.plan as ISubscription['plan'];

    const [subs, total] = await Promise.all([
      Subscription.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscription.countDocuments(query),
    ]);
    const userIds = [...new Set(subs.map((s) => s.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email avatar').lean<UserLite[]>();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const items = subs.map((s) => ({ ...s, user: userMap.get(s.userId.toString()) ?? null }));
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },
};
