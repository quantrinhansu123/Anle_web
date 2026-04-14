import type { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service';
import { paginatedResponse, successResponse } from '../../utils/response';

const service = new JobService();

function getUserId(req: Request): string | undefined {
  const u = (req as Request & { user?: { id?: string } }).user;
  return u?.id;
}

export const jobController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 100;
      const { data, count } = await service.findAll(page, limit);
      res.json(paginatedResponse(data, count, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await service.findById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      res.json(successResponse(job, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await service.create(req.body, getUserId(req));
      res.status(201).json(successResponse(job, 'Job created'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await service.update(req.params.id, req.body);
      res.json(successResponse(job, 'Job updated'));
    } catch (err) {
      next(err);
    }
  },

  async patchWorkflow(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await service.updateWorkflow(req.params.id, req.body.workflow_status);
      res.json(successResponse(job, 'Workflow updated'));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      res.json(successResponse(null, 'Job deleted'));
    } catch (err) {
      next(err);
    }
  },

  async getSeaHouseBl(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getSeaHouseBl(req.params.id);
      res.json(successResponse(data, 'OK'));
    } catch (err) {
      next(err);
    }
  },

  async patchSeaHouseBl(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.patchSeaHouseBl(req.params.id, req.body as Record<string, unknown>);
      res.json(successResponse(data, 'Sea House B/L updated'));
    } catch (err) {
      next(err);
    }
  },
};
