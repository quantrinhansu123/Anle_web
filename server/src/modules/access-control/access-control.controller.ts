import { Request, Response, NextFunction } from 'express';
import { accessControlService } from './access-control.service';
import { successResponse } from '../../utils/response';

export const accessControlController = {
  async listRoleKeys(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accessControlService.listRoleKeys();
      res.json(successResponse(data, 'Access role keys fetched'));
    } catch (err) {
      next(err);
    }
  },

  async createRoleKey(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accessControlService.createRoleKey(req.body);
      res.status(201).json(successResponse(data, 'Access role key created'));
    } catch (err) {
      next(err);
    }
  },

  async deleteRoleKey(req: Request, res: Response, next: NextFunction) {
    try {
      await accessControlService.deleteRoleKey(req.params.key);
      res.json(successResponse(null, 'Access role key deleted'));
    } catch (err) {
      next(err);
    }
  },

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accessControlService.getPermissions(req.params.roleKey);
      res.json(successResponse(data, 'Permissions fetched'));
    } catch (err) {
      next(err);
    }
  },

  async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const viewPaths = Array.isArray(req.body?.view_paths)
        ? req.body.view_paths
        : Array.isArray(req.body?.viewPaths)
          ? req.body.viewPaths
          : [];
      const data = await accessControlService.setPermissions(req.params.roleKey, viewPaths);
      res.json(successResponse(data, 'Permissions saved'));
    } catch (err) {
      next(err);
    }
  },
};
