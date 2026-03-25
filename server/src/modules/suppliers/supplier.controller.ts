import type { Request, Response, NextFunction } from 'express';
import { SupplierService } from './supplier.service';
import { successResponse, paginatedResponse } from '../../utils/response';

const service = new SupplierService();

export const SupplierController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await service.findAll(page, limit);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Supplier not found' });
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item, 'Supplier created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(successResponse(item, 'Supplier updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getDetails(req.params.id);
      if (!result) return res.status(404).json({ message: 'Supplier not found' });
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },
};
