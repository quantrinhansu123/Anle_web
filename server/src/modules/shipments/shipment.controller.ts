import type { Request, Response, NextFunction } from 'express';
import { ShipmentService } from './shipment.service';
import { successResponse, paginatedResponse } from '../../utils/response';

const service = new ShipmentService();

export const ShipmentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const result = await service.findAll(page, limit, { q });
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getNextCode(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.query.customerId as string;
      if (!customerId) return res.status(400).json({ message: 'customerId is required' });
      const nextCode = await service.generateNextCode(customerId);
      res.json(successResponse({ code: nextCode }));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Shipment not found' });
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async getReadiness(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getReadiness(req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item, 'Shipment created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(successResponse(item, 'Shipment updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.updateStatus(req.params.id, req.body.status);
      res.json(successResponse(item, 'Shipment status updated successfully'));
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

  async getAllowedTransitions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getAllowedTransitions(req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getRunGates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getRunGates(req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async getFeasibility(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getFeasibilityApprovals(req.params.id);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async updateFeasibility(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const result = await service.updateFeasibilityApproval(req.params.id, req.body, userId);
      res.json(successResponse(result, 'Feasibility updated'));
    } catch (err) {
      next(err);
    }
  },

  async getBlLines(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getBlLines(req.params.id);
      res.json(successResponse(data));
    } catch (err) {
      next(err);
    }
  },

  async replaceBlLines(req: Request, res: Response, next: NextFunction) {
    try {
      await service.replaceBlLines(req.params.id, req.body);
      const data = await service.getBlLines(req.params.id);
      res.json(successResponse(data, 'B/L lines updated'));
    } catch (err) {
      next(err);
    }
  },

  async getSeaHouseBl(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getSeaHouseBl(req.params.id);
      res.json(successResponse(data, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async patchSeaHouseBl(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.patchSeaHouseBl(req.params.id, req.body as Record<string, unknown>);
      res.json(successResponse(data, 'Sea House B/L updated'));
    } catch (err) {
      next(err);
    }
  },
};
