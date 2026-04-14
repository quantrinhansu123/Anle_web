import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { FmsJobProfitByPerformanceRow } from './reports.types';

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapRow(r: Record<string, unknown>): FmsJobProfitByPerformanceRow {
  return {
    job_id: String(r.job_id ?? ''),
    master_job_no: String(r.master_job_no ?? ''),
    performance_date: String(r.performance_date ?? '').slice(0, 10),
    customer_name: String(r.customer_name ?? ''),
    salesman_name: String(r.salesman_name ?? ''),
    pre_tax_sell: num(r.pre_tax_sell),
    pre_tax_buy: num(r.pre_tax_buy),
    pre_tax_margin: num(r.pre_tax_margin),
    vat_sell: num(r.vat_sell),
    vat_buy: num(r.vat_buy),
    vat_margin: num(r.vat_margin),
    total_sell: num(r.total_sell),
    total_buy: num(r.total_buy),
    total_margin: num(r.total_margin),
    margin_percent: r.margin_percent === null || r.margin_percent === undefined ? null : num(r.margin_percent),
  };
}

export const reportsService = {
  async jobProfitByPerformanceDate(params: {
    from: string;
    to: string;
    page: number;
    limit: number;
  }): Promise<{ rows: FmsJobProfitByPerformanceRow[]; total: number }> {
    const { from, to, page, limit } = params;
    const fromIdx = (page - 1) * limit;
    const toIdx = fromIdx + limit - 1;

    const q = supabase
      .from('fms_job_profit_by_performance_v')
      .select('*', { count: 'exact' })
      .gte('performance_date', from)
      .lte('performance_date', to)
      .order('performance_date', { ascending: false })
      .order('master_job_no', { ascending: true });

    const { data, error, count } = await q.range(fromIdx, toIdx);

    if (error) {
      const hint = /fms_job_profit_by_performance_v|does not exist|42P01/i.test(error.message)
        ? ' Apply migration: server/sql/migrations/20260426_fms_job_profit_by_performance.sql'
        : '';
      throw new AppError(`${error.message}.${hint}`.trim(), 500);
    }

    const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
    return { rows, total: count ?? 0 };
  },
};
