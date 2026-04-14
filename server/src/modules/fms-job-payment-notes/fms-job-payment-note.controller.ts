import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { FmsJobPaymentNoteService } from './fms-job-payment-note.service';

const service = new FmsJobPaymentNoteService();

export const FmsJobPaymentNoteController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.listByJob(req.params.id);
      res.json(successResponse(data, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id, req.params.pnId);
      if (!item) return res.status(404).json({ success: false, message: 'Payment Note not found' });
      res.json(successResponse(item, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.params.id, req.body);
      res.status(201).json(successResponse(item, 'Payment Note created'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.params.pnId, req.body);
      res.json(successResponse(item, 'Payment Note updated'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id, req.params.pnId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
