import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { FmsJobDebitNoteService } from './fms-job-debit-note.service';

const service = new FmsJobDebitNoteService();

export const FmsJobDebitNoteController = {
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
      const item = await service.findById(req.params.id, req.params.dnId);
      if (!item) return res.status(404).json({ success: false, message: 'Debit Note not found' });
      res.json(successResponse(item, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.params.id, req.body);
      res.status(201).json(successResponse(item, 'Debit Note created'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.params.dnId, req.body);
      res.json(successResponse(item, 'Debit Note updated'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id, req.params.dnId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
