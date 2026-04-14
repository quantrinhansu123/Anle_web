import { Request, Response, NextFunction } from 'express';
import { AccountingDashboardService } from './accounting-dashboard.service';
import { successResponse } from '../../utils/response';

const service = new AccountingDashboardService();

export class AccountingDashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getSummary();
      res.json(successResponse(data));
    } catch (error) {
      next(error);
    }
  }
}
