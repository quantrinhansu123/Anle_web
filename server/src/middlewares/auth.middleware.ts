import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './error.middleware';

export const authMiddleware = (req: Request, res: Response, _next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role?: string;
      department_code?: string;
      position?: string;
      spending_limit?: number;
    };
    (req as any).user = decoded;
    _next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
};
