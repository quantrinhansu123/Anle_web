import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { validate } from '../../middlewares/validate.middleware';
import { createNotificationSchema } from './notification.schema';

const router = Router();

router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.unreadCount);
router.post('/', validate(createNotificationSchema), NotificationController.create);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/mark-all-read', NotificationController.markAllAsRead);

export default router;
