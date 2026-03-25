import type { Request, Response, NextFunction } from 'express';
import { exchangeRateService } from './exchange-rate.service';
import { successResponse } from '../../utils/response';

export const ExchangeRateController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await exchangeRateService.findAll();
      res.json(successResponse(data));
    } catch (err) {
      next(err);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await exchangeRateService.upsert(req.body);
      res.json(successResponse(item, 'Exchange rate saved successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await exchangeRateService.update(req.params.id, req.body);
      res.json(successResponse(item, 'Exchange rate updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await exchangeRateService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};
