import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  FmsDashboardPayload,
  FmsMonthlyRow,
  FmsServiceRevenueRow,
  FmsShipmentStatusRow,
} from './fms-dashboard.types';

export const fmsDashboardService = {
  async getDashboard(filters: { from: string; to: string }): Promise<FmsDashboardPayload> {
    const { data, error } = await supabase.rpc('fms_dashboard_stats', {
      p_from: filters.from,
      p_to: filters.to,
    });

    if (error) {
      const hint =
        /fms_dashboard_stats|does not exist|42883/i.test(error.message)
          ? ' Apply database migration: server/sql/migrations/20260418_fms_dashboard_stats_date_range.sql (replaces 20260417).'
          : '';
      throw new AppError(`${error.message}.${hint}`.trim(), 500);
    }

    if (!data || typeof data !== 'object') {
      throw new AppError('Invalid FMS dashboard response', 500);
    }

    const raw = data as Record<string, unknown>;
    const summary = raw.summary as FmsDashboardPayload['summary'];
    if (!summary) {
      throw new AppError('Invalid FMS dashboard response: missing summary', 500);
    }

    return {
      summary: {
        totalRevenueVnd: Number(summary.totalRevenueVnd) || 0,
        totalCostVnd: Number(summary.totalCostVnd) || 0,
        customerCount: Number(summary.customerCount) || 0,
        totalShipments: Number(summary.totalShipments) || 0,
        grossProfitVnd: Number(summary.grossProfitVnd) || 0,
      },
      shipmentStatus: Array.isArray(raw.shipmentStatus)
        ? (raw.shipmentStatus as FmsShipmentStatusRow[]).map((r) => ({
            status: String(r.status),
            count: Number(r.count) || 0,
          }))
        : [],
      monthly: Array.isArray(raw.monthly)
        ? (raw.monthly as FmsMonthlyRow[]).map((r) => ({
            month: String(r.month),
            monthStart: String(r.monthStart),
            volumeTeu: Number(r.volumeTeu) || 0,
            revenueVnd: Number(r.revenueVnd) || 0,
          }))
        : [],
      revenueByService: Array.isArray(raw.revenueByService)
        ? (raw.revenueByService as FmsServiceRevenueRow[]).map((r) => ({
            name: String(r.name),
            revenueVnd: Number(r.revenueVnd) || 0,
          }))
        : [],
    };
  },
};
