import type { Request, Response, NextFunction } from 'express';
import { salesChargeCatalogService } from './sales-charge-catalog.service';
import { successResponse } from '../../utils/response';

export const SalesChargeCatalogController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesChargeCatalogService.findAll();
      res.json(successResponse(data));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await salesChargeCatalogService.create(req.body);
      res.json(successResponse(item, 'Đã thêm cước phí'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await salesChargeCatalogService.update(req.params.id, req.body);
      res.json(successResponse(item, 'Đã cập nhật cước phí'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await salesChargeCatalogService.delete(req.params.id);
      res.json(successResponse(null, 'Đã xóa cước phí'));
    } catch (err) {
      next(err);
    }
  },
};
