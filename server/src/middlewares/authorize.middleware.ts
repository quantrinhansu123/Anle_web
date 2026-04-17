import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * Role hierarchy (higher index = more power)
 */
const ROLE_HIERARCHY: Record<string, number> = {
  staff: 1,
  senior_staff: 2,
  manager: 3,
  director: 4,
  ceo: 5,
  admin: 6,
};

/**
 * Check if a user's role meets the minimum required level
 */
export const hasMinimumRole = (userRole: string, requiredRole: string): boolean => {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

/**
 * Middleware: Require specific roles
 * Usage: authorize('ceo', 'director')
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    if (!user.role) {
      throw new AppError('User role not defined', 403);
    }

    // Admin/CEO/BOD always has full access (including legacy 'Admin' position)
    if (user.role === 'admin' || user.role === 'ceo' || user.position === 'Admin' || user.department_code === 'bod' || allowedRoles.includes(user.role)) {
      return next();
    }

    throw new AppError('Insufficient permissions', 403);
  };
};

/**
 * Middleware: Require minimum role level
 * Usage: requireRole('manager') — allows manager, director, ceo
 */
export const requireRole = (minimumRole: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    if (!hasMinimumRole(user.role || 'staff', minimumRole)) {
      throw new AppError('Insufficient role level', 403);
    }

    next();
  };
};

/**
 * Middleware: Require specific department access
 * BOD/CEO always has access to all departments
 * Usage: departmentAccess('logistics', 'procurement')
 */
export const departmentAccess = (...allowedDepts: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // CEO/Admin/BOD always has full access
    if (user.role === 'ceo' || user.role === 'admin' || user.department_code === 'bod') {
      return next();
    }

    if (!user.department_code || !allowedDepts.includes(user.department_code)) {
      throw new AppError('Department access denied', 403);
    }

    next();
  };
};

/**
 * Middleware: Check spending limit for financial operations
 * Usage: checkSpendingLimit('amount')
 */
export const checkSpendingLimit = (amountField: string = 'amount') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const amount = Number(req.body[amountField] || 0);
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // CEO/Admin has unlimited spending
    if (user.role === 'ceo' || user.role === 'admin') {
      return next();
    }

    const limit = Number(user.spending_limit || 0);

    if (amount > limit) {
      throw new AppError(
        `Amount ${amount.toLocaleString()} VND exceeds your spending limit of ${limit.toLocaleString()} VND. Approval required.`,
        403
      );
    }

    next();
  };
};
