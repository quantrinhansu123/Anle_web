import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { AccountDictionaryService } from './account-dictionary.service';

const service = new AccountDictionaryService();

export const AccountDictionaryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 200;
      const result = await service.list(page, limit);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await service.create(req.body);
      res.status(201).json(successResponse(row, 'Account created'));
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const row = await service.update(req.params.id, req.body);
      res.json(successResponse(row, 'Account updated'));
    } catch (e) {
      next(e);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.remove(req.params.id);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
};

