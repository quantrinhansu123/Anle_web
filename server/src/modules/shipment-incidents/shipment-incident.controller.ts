import type { Request, Response, NextFunction } from 'express';
import { ShipmentIncidentService } from './shipment-incident.service';
import { successResponse } from '../../utils/response';

const service = new ShipmentIncidentService();

export const ShipmentIncidentController = {
  async listByShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.query.shipmentId as string;
      if (!shipmentId) return res.status(400).json({ message: 'shipmentId is required' });
      const items = await service.findByShipment(shipmentId);
      res.json(successResponse(items));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Incident not found' });
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item, 'Incident reported'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(successResponse(item, 'Incident updated'));
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
