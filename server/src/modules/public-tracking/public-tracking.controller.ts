import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { PublicTrackingService } from './public-tracking.service';

const service = new PublicTrackingService();

export const PublicTrackingController = {
  async track(req: Request, res: Response, next: NextFunction) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (!q) {
        return res.status(400).json({ success: false, message: 'q is required' });
      }
      const result = await service.findByKeyword(q);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Tracking not found' });
      }
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};

