import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { NotificationController } from '../../controllers/notification.controller';

/** Validates that `params.id` is a syntactically-valid MongoDB ObjectId. */
const objectIdParamSchema = z.object({
  params: z.object({
    id: z.string().refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid notification id' }),
  }),
});

const router = Router();

router.use(authenticate);
router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.unreadCount);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', validate(objectIdParamSchema), NotificationController.markRead);

export default router;
