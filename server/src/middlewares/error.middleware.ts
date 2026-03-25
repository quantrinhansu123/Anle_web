import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error('SERVER ERROR:', err);
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';
  
  // Return richer error info in development
  res.status(status).json({ 
    success: false, 
    message,
    details: err.details || undefined,
    hint: err.hint || undefined,
    code: err.code || undefined
  });
}
