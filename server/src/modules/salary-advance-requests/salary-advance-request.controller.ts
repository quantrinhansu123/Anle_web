import { Request, Response, NextFunction } from 'express';
import {
  SalaryAdvanceRequestService,
  parseListFiltersFromQuery,
} from './salary-advance-request.service';
import { paginatedResponse, successResponse } from '../../utils/response';
import {
  createSalaryAdvanceRequestSchema,
  updateSalaryAdvanceRequestSchema,
} from './salary-advance-request.schema';

const service = new SalaryAdvanceRequestService();

export class SalaryAdvanceRequestController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getStats();
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = parseListFiltersFromQuery(req.query as Record<string, unknown>);
      const result = await service.findAll(page, limit, filters);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findById(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Salary advance request not found' });
      }
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createSalaryAdvanceRequestSchema.parse(req.body);
      const result = await service.create(validated);
      res.status(201).json(successResponse(result, 'Salary advance request created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateSalaryAdvanceRequestSchema.parse(req.body);
      const result = await service.update(req.params.id, validated);
      res.json(successResponse(result, 'Salary advance request updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      res.json(successResponse(null, 'Salary advance request deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
