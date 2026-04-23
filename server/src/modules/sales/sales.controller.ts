import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { CreateSalesSchema, SendQuotationEmailSchema, UpdateSalesSchema } from './sales.schema';

export const salesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { data, count } = await salesService.getAll(page, limit);
      res.json(paginatedResponse(data, count || 0, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesService.getById(req.params.id);
      res.json(successResponse(data, 'Sales item fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = CreateSalesSchema.parse(req.body);
      const data = await salesService.create(validatedData);
      res.status(201).json(successResponse(data, 'Sales item created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = UpdateSalesSchema.parse(req.body);
      const data = await salesService.update(req.params.id, validatedData);
      res.json(successResponse(data, 'Sales item updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await salesService.delete(req.params.id);
      res.json(successResponse(null, 'Sales item deleted successfully'));
    } catch (err) {
      next(err);
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesService.confirm(req.params.id);
      res.json(successResponse(data, 'Quotation confirmed'));
    } catch (err) {
      next(err);
    }
  },

  async markWon(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesService.markWon(req.params.id);
      res.json(successResponse(data, 'Quotation marked as won'));
    } catch (err) {
      next(err);
    }
  },

  async markLost(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await salesService.markLost(req.params.id);
      res.json(successResponse(data, 'Quotation marked as lost'));
    } catch (err) {
      next(err);
    }
  },

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = SendQuotationEmailSchema.parse(req.body || {});
      const data = await salesService.sendEmail(req.params.id, payload);
      res.json(successResponse(data, 'Quotation send logged'));
    } catch (err) {
      next(err);
    }
  },

  async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const shipmentPayload = req.body?.shipment;
      const data = await salesService.createJob(req.params.id, shipmentPayload);
      res.json(successResponse(data, data.already_created ? 'Job already existed' : 'Job created from quotation'));
    } catch (err) {
      next(err);
    }
  },
};
