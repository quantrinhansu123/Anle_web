import { Request, Response, NextFunction } from 'express';
import { PaymentRequestService } from './payment-request.service';
import { paginatedResponse, successResponse } from '@/utils/response';
import { createPaymentRequestSchema, updatePaymentRequestSchema } from './payment-request.schema';

const service = new PaymentRequestService();

export class PaymentRequestController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await service.findAll(page, limit);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findById(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: 'Payment request not found' });
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createPaymentRequestSchema.parse(req.body);
      const result = await service.create(validated as any);
      res.status(201).json(successResponse(result, 'Payment request created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updatePaymentRequestSchema.parse(req.body);
      const result = await service.update(req.params.id, validated as any);
      res.json(successResponse(result, 'Payment request updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      res.json(successResponse(null, 'Payment request deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
