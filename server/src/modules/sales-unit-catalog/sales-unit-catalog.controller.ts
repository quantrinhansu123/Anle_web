import type { Request, Response, NextFunction } from 'express';
import { salesUnitCatalogService } from './sales-unit-catalog.service';
import { successResponse } from '../../utils/response';

export const SalesUnitCatalogController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesUnitCatalogService.findAll();
      res.json(successResponse(data));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await salesUnitCatalogService.create(req.body);
      res.json(successResponse(item, 'Đã thêm đơn vị'));
    } catch (err) {
      next(err);
    }
  },
};
