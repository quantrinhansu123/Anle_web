import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { CreateSalesItemSchema, UpdateSalesItemSchema } from './sales.schema';

export const salesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, count } = await salesService.getAll(page, limit);
      res.json(paginatedResponse(data, count || 0, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesService.getById(req.params.id);
      res.json(successResponse(data, 'Sales item fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = CreateSalesItemSchema.parse(req.body);
      const data = await salesService.create(validatedData);
      res.status(201).json(successResponse(data, 'Sales item created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = UpdateSalesItemSchema.parse(req.body);
      const data = await salesService.update(req.params.id, validatedData);
      res.json(successResponse(data, 'Sales item updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await salesService.delete(req.params.id);
      res.json(successResponse(null, 'Sales item deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
};
