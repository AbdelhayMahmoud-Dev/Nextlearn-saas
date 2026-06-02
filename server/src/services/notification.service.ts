import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification.model';
import { buildPaginationMeta, getPagination } from '../utils/pagination';
import { emitToUser } from '../config/socket';

interface CreateArgs {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export const NotificationService = {
  /**
   * Creates a notification for a user (fired from real domain events) and
   * pushes it to the user's Socket.io room for real-time delivery. The emit is
   * fire-and-forget and safe even when Socket.io is not initialised.
   */
  async create(tenantId: string, userId: string, data: CreateArgs) {
    const notif = await Notification.create({
      tenantId: new Types.ObjectId(tenantId),
      userId: new Types.ObjectId(userId),
      type: data.type,
      title: data.title,
      body: data.body ?? '',
      link: data.link,
    });
    emitToUser(userId, 'notification', notif.toObject());
    return notif;
  },

  async list(tenantId: string, userId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = getPagination(query, 30);
    const [items, total] = await Promise.all([
      Notification.find({ tenantId, userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ tenantId, userId }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  async unreadCount(tenantId: string, userId: string): Promise<number> {
    return Notification.countDocuments({ tenantId, userId, isRead: false });
  },

  async markRead(tenantId: string, userId: string, id: string): Promise<void> {
    await Notification.updateOne({ _id: id, tenantId, userId }, { $set: { isRead: true } });
  },

  async markAllRead(tenantId: string, userId: string): Promise<void> {
    await Notification.updateMany({ tenantId, userId, isRead: false }, { $set: { isRead: true } });
  },
};
