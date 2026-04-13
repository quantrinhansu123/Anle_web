import type { Request, Response, NextFunction } from 'express';
import { fmsDashboardService } from './fms-dashboard.service';
import { successResponse } from '../../utils/response';
import { AppError } from '../../middlewares/error.middleware';

const ymdRe = /^\d{4}-\d{2}-\d{2}$/;

function parseQueryDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !ymdRe.test(value)) return undefined;
  return value;
}

function firstQueryParam(value: unknown): unknown {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const FmsDashboardController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      let from = parseQueryDate(firstQueryParam(req.query.from));
      let to = parseQueryDate(firstQueryParam(req.query.to));
      if (from && !to) to = from;
      if (to && !from) from = to;
      if (from && to && from > to) {
        const swap = from;
        from = to;
        to = swap;
      }

      if (!from || !to) {
        throw new AppError(
          'Query parameters "from" and "to" are required (YYYY-MM-DD). Apply migration 20260418_fms_dashboard_stats_date_range.sql if the database function is outdated.',
          400,
        );
      }

      const data = await fmsDashboardService.getDashboard({ from, to });
      res.json(successResponse(data));
    } catch (err) {
      next(err);
    }
  },
};
