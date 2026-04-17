import type { Request, Response, NextFunction } from 'express';
import { ShipmentTrackingService } from './shipment-tracking.service';
import { successResponse } from '../../utils/response';

const service = new ShipmentTrackingService();

export const ShipmentTrackingController = {
  async listByShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.query.shipmentId as string;
      if (!shipmentId) return res.status(400).json({ message: 'shipmentId is required' });
      const events = await service.findByShipment(shipmentId);
      res.json(successResponse(events));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Tracking event not found' });
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async getSlaInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentId = req.query.shipmentId as string;
      if (!shipmentId) return res.status(400).json({ message: 'shipmentId is required' });
      const slaInfo = await service.getSlaInfo(shipmentId);
      res.json(successResponse(slaInfo));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item, 'Tracking event created'));
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
