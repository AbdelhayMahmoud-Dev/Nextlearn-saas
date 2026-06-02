import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { NotificationService } from '../services/notification.service';

export const NotificationController = {
  list: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const { items, meta } = await NotificationService.list(user.tenantId, user.id, req.query);
    ApiResponse.success(res, items, 'Notifications', 200, meta);
  }),

  unreadCount: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const count = await NotificationService.unreadCount(user.tenantId, user.id);
    ApiResponse.success(res, { count }, 'Unread count');
  }),

  markRead: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await NotificationService.markRead(user.tenantId, user.id, req.params.id);
    ApiResponse.success(res, null, 'Marked as read');
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    await NotificationService.markAllRead(user.tenantId, user.id);
    ApiResponse.success(res, null, 'All marked as read');
  }),
};
