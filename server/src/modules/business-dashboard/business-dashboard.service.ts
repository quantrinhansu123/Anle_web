import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  BusinessDashboardCountRow,
  BusinessDashboardMoneyRow,
  BusinessDashboardPayload,
} from './business-dashboard.types';

export const businessDashboardService = {
  async getDashboard(filters: { from: string; to: string }): Promise<BusinessDashboardPayload> {
    const { data, error } = await supabase.rpc('business_dashboard_stats', {
      p_from: filters.from,
      p_to: filters.to,
    });

    if (error) {
      const hint =
        /business_dashboard_stats|does not exist|42883/i.test(error.message)
          ? ' Apply database migration: server/sql/migrations/20260427_business_dashboard_stats.sql.'
          : '';
      throw new AppError(`${error.message}.${hint}`.trim(), 500);
    }

    if (!data || typeof data !== 'object') {
      throw new AppError('Invalid business dashboard response', 500);
    }

    const raw = data as Record<string, unknown>;

    const mapMoney = (arr: unknown): BusinessDashboardMoneyRow[] =>
      Array.isArray(arr)
        ? (arr as { name?: string; revenueVnd?: unknown }[]).map((r) => ({
            name: String(r.name ?? ''),
            revenueVnd: Number(r.revenueVnd) || 0,
          }))
        : [];

    const mapCount = (arr: unknown): BusinessDashboardCountRow[] =>
      Array.isArray(arr)
        ? (arr as { name?: string; count?: unknown }[]).map((r) => ({
            name: String(r.name ?? ''),
            count: Number(r.count) || 0,
          }))
        : [];

    return {
      salesRevenueByPerson: mapMoney(raw.salesRevenueByPerson),
      customerRevenue: mapMoney(raw.customerRevenue),
      revenueByService: mapMoney(raw.revenueByService),
      customersByShipmentStatus: mapCount(raw.customersByShipmentStatus),
    };
  },
};
