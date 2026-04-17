import { Request, Response, NextFunction } from 'express';
import { departmentService } from './department.service';
import { successResponse } from '../../utils/response';

export const departmentController = {
  async getAllDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await departmentService.getAllDepartments();
      res.json(successResponse(data, 'Departments fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async getTeamsByDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await departmentService.getTeamsByDepartment(req.params.code);
      res.json(successResponse(data, 'Teams fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async getAllTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await departmentService.getAllTeams();
      res.json(successResponse(data, 'All teams fetched successfully'));
    } catch (err) {
      next(err);
    }
  }
};
