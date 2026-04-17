import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middlewares/error.middleware';
import { successResponse } from '../../utils/response';
import { reportsService } from './reports.service';

const ymdRe = /^\d{4}-\d{2}-\d{2}$/;

function parseQueryDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !ymdRe.test(value)) return undefined;
  return value;
}

function firstQueryParam(value: unknown): unknown {
  if (Array.isArray(value)) return value[0];
  return value;
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export const reportsController = {
  async jobProfitByPerformanceDate(req: Request, res: Response, next: NextFunction) {
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
        throw new AppError('Query parameters "from" and "to" are required (YYYY-MM-DD).', 400);
      }

      const page = clampInt(Number(firstQueryParam(req.query.page)) || 1, 1, 1_000_000);
      const limit = clampInt(Number(firstQueryParam(req.query.limit)) || 50, 1, 200);

      const { rows, total } = await reportsService.jobProfitByPerformanceDate({ from, to, page, limit });
      const totalPages = Math.ceil(total / limit) || 0;

      res.json(
        successResponse(
          {
            rows,
            pagination: { total, page, limit, totalPages },
          },
          'OK',
        ),
      );
    } catch (err) {
      next(err);
    }
  },

  async shipmentProfitLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const page = clampInt(Number(firstQueryParam(req.query.page)) || 1, 1, 1_000_000);
      const limit = clampInt(Number(firstQueryParam(req.query.limit)) || 50, 1, 200);
      const status = typeof firstQueryParam(req.query.status) === 'string'
        ? String(firstQueryParam(req.query.status))
        : undefined;

      const { rows, total } = await reportsService.shipmentProfitLoss({ page, limit, status });
      const totalPages = Math.ceil(total / limit) || 0;

      res.json(
        successResponse(
          {
            rows,
            pagination: { total, page, limit, totalPages },
          },
          'OK',
        ),
      );
    } catch (err) {
      next(err);
    }
  },
};
