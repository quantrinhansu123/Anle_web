import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { FmsJobInvoiceService, parseFmsJobInvoiceListFiltersFromQuery } from './fms-job-invoice.service';

const service = new FmsJobInvoiceService();

export const FmsJobInvoiceController = {
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = parseFmsJobInvoiceListFiltersFromQuery(req.query as Record<string, unknown>);
      const result = await service.findAllGlobal(page, limit, filters);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (err) {
      next(err);
    }
  },

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
      const item = await service.findById(req.params.id, req.params.invoiceId);
      if (!item) return res.status(404).json({ success: false, message: 'Invoice not found' });
      res.json(successResponse(item, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.params.id, req.body);
      res.status(201).json(successResponse(item, 'Invoice created'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.params.invoiceId, req.body);
      res.json(successResponse(item, 'Invoice updated'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id, req.params.invoiceId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { result, invoice } = await service.recordPayment(req.params.id, req.params.invoiceId, req.body);
      res.json(
        successResponse(
          { paymentResult: result, invoice },
          'Payment recorded',
        ),
      );
    } catch (err) {
      next(err);
    }
  },
};
