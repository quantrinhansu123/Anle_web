import type { Request, Response, NextFunction } from 'express';
import { ShipmentCostService } from './shipment-cost.service';
import { successResponse, paginatedResponse } from '../../utils/response';

const service = new ShipmentCostService();

export const ShipmentCostController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const shipmentId = req.query.shipmentId as string | undefined;
      const result = await service.findAll(page, limit, shipmentId);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Shipment cost not found' });
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await service.getCostSummary(req.params.shipmentId);
      res.json(successResponse(summary));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item, 'Shipment cost created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(successResponse(item, 'Shipment cost updated successfully'));
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
};
