import { Request, Response, NextFunction } from 'express';
import { approvalRequestService } from './approval-request.service';
import { successResponse } from '../../utils/response';

export const approvalRequestController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, department_code, id } = (req as any).user;
      const data = await approvalRequestService.getAll(role, department_code, id);
      res.json(successResponse(data, 'Approval requests fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const requester_id = (req as any).user.id;
      const data = await approvalRequestService.create({ ...req.body, requester_id });
      res.status(201).json(successResponse(data, 'Approval request created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const approverId = (req as any).user.id;
      const { notes } = req.body;
      const data = await approvalRequestService.approve(req.params.id, approverId, notes);
      res.json(successResponse(data, 'Request approved successfully'));
    } catch (err) {
      next(err);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const approverId = (req as any).user.id;
      const { reason } = req.body;
      const data = await approvalRequestService.reject(req.params.id, approverId, reason);
      res.json(successResponse(data, 'Request rejected successfully'));
    } catch (err) {
      next(err);
    }
  }
};
