import { Request, Response, NextFunction } from 'express';
import {
  CustomerExpenseService,
  parseCustomerExpenseListFiltersFromQuery,
} from './customer-expense.service';
import { paginatedResponse, successResponse } from '../../utils/response';
import {
  createCustomerExpenseSchema,
  updateCustomerExpenseSchema,
} from './customer-expense.schema';

const service = new CustomerExpenseService();

export class CustomerExpenseController {
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
      const filters = parseCustomerExpenseListFiltersFromQuery(req.query as Record<string, unknown>);
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
        return res.status(404).json({ success: false, message: 'Customer expense not found' });
      }
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createCustomerExpenseSchema.parse(req.body);
      const result = await service.create(validated);
      res.status(201).json(successResponse(result, 'Customer expense created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateCustomerExpenseSchema.parse(req.body);
      const result = await service.update(req.params.id, validated);
      res.json(successResponse(result, 'Customer expense updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      res.json(successResponse(null, 'Customer expense deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
