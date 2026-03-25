import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';
import { successResponse } from '@/utils/response';

export const employeeController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeeService.getAll();
      res.json(successResponse(data, 'Employees fetched successfully'));
    } catch (err) {
      next(err);
    }
  }
};
