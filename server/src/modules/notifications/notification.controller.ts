import type { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { successResponse } from '../../utils/response';

const service = new NotificationService();

export const NotificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const unreadOnly = req.query.unreadOnly === 'true';
      const cursor = req.query.cursor as string | undefined;
      const items = await service.findByUser(userId, limit, unreadOnly, cursor);
      res.json(successResponse(items));
    } catch (err) {
      next(err);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const count = await service.getUnreadCount(userId);
      res.json(successResponse({ count }));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item, 'Notification created'));
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await service.markAsRead(req.params.id);
      res.json(successResponse(null, 'Marked as read'));
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      await service.markAllAsRead(userId);
      res.json(successResponse(null, 'All notifications marked as read'));
    } catch (err) {
      next(err);
    }
  },
};
