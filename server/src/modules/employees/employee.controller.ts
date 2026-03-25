import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service';
import { successResponse } from '../../utils/response';

export const employeeController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeeService.getAll();
      res.json(successResponse(data, 'Employees fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeeService.getById(req.params.id);
      res.json(successResponse(data, 'Employee fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeeService.getByIdWithRelations(req.params.id);
      res.json(successResponse(data, 'Employee details fetched successfully'));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeeService.create(req.body);
      res.status(201).json(successResponse(data, 'Employee created successfully'));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeeService.update(req.params.id, req.body);
      res.json(successResponse(data, 'Employee updated successfully'));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await employeeService.delete(req.params.id);
      res.json(successResponse(null, 'Employee deleted successfully'));
    } catch (err) {
      next(err);
    }
  }
};
