import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../utils/response';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      res.json(successResponse(data, 'Login successful'));
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user will be populated by authMiddleware
      const userId = (req as any).user.id;
      const data = await authService.getProfile(userId);
      res.json(successResponse(data, 'Profile fetched successful'));
    } catch (err) {
      next(err);
    }
  }
};
