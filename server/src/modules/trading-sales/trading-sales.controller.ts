import { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { tradingSalesService } from './trading-sales.service';
import { CreateTradingSaleSchema, UpdateTradingSaleSchema } from './trading-sales.schema';

export const tradingSalesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, count } = await tradingSalesService.getAll(page, limit);
      res.json(paginatedResponse(data, count || 0, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await tradingSalesService.getById(req.params.id);
      res.json(successResponse(data, 'Trading sale fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = CreateTradingSaleSchema.parse(req.body);
      const data = await tradingSalesService.create(validated);
      res.status(201).json(successResponse(data, 'Trading sale created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UpdateTradingSaleSchema.parse(req.body);
      const data = await tradingSalesService.update(req.params.id, validated);
      res.json(successResponse(data, 'Trading sale updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await tradingSalesService.delete(req.params.id);
      res.json(successResponse(null, 'Trading sale deleted successfully'));
    } catch (err) {
      next(err);
    }
  },
};

