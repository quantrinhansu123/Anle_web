import { Request, Response, NextFunction } from 'express';
import { purchasingService } from './purchasing.service';
import { successResponse, paginatedResponse } from '@/utils/response';
import { CreatePurchasingItemSchema, UpdatePurchasingItemSchema } from './purchasing.schema';

export const purchasingController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, count } = await purchasingService.getAll(page, limit);
      res.json(paginatedResponse(data, count || 0, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchasingService.getById(req.params.id);
      res.json(successResponse(data, 'Purchasing item fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = CreatePurchasingItemSchema.parse(req.body);
      const data = await purchasingService.create(validatedData);
      res.status(201).json(successResponse(data, 'Purchasing item created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = UpdatePurchasingItemSchema.parse(req.body);
      const data = await purchasingService.update(req.params.id, validatedData);
      res.json(successResponse(data, 'Purchasing item updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await purchasingService.delete(req.params.id);
      res.json(successResponse(null, 'Purchasing item deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
};
