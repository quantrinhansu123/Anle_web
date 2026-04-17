import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type { FmsJobProfitByPerformanceRow, ShipmentProfitLossRow } from './reports.types';

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

  /**
   * Per-shipment profit/loss report (SOP Section III).
   * Revenue = sum of sales_items.total for all quotations linked to the shipment.
   * Cost = sum of shipment_costs planned/actual amounts.
   */
  async shipmentProfitLoss(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ rows: ShipmentProfitLossRow[]; total: number }> {
    const { page, limit, status } = params;
    const fromIdx = (page - 1) * limit;
    const toIdx = fromIdx + limit - 1;

    // 1. Get shipments with customer/supplier joins
    let query = supabase
      .from('shipments')
      .select('id, code, status, commodity, etd, eta, customers(company_name), suppliers(company_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(fromIdx, toIdx);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: shipments, error: shipErr, count } = await query;
    if (shipErr) throw new AppError(shipErr.message, 500);

    if (!shipments || shipments.length === 0) {
      return { rows: [], total: count ?? 0 };
    }

    const shipmentIds = shipments.map((s: any) => s.id);

    // 2. Get revenue: sum of sales_items.total grouped by shipment
    const { data: revenueData, error: revErr } = await supabase
      .from('sales')
      .select('shipment_id, sales_items(total)')
      .in('shipment_id', shipmentIds);

    if (revErr) throw new AppError(revErr.message, 500);

    const revenueByShipment: Record<string, number> = {};
    for (const sale of (revenueData ?? [])) {
      const sid = (sale as any).shipment_id;
      const items = (sale as any).sales_items ?? [];
      const total = items.reduce((sum: number, item: any) => sum + num(item.total), 0);
      revenueByShipment[sid] = (revenueByShipment[sid] ?? 0) + total;
    }

    // 3. Get costs: planned + actual per shipment
    const { data: costData, error: costErr } = await supabase
      .from('shipment_costs')
      .select('shipment_id, planned_amount, actual_amount')
      .in('shipment_id', shipmentIds);

    if (costErr) throw new AppError(costErr.message, 500);

    const costByShipment: Record<string, { planned: number; actual: number; lines: number; allReconciled: boolean }> = {};
    for (const cost of (costData ?? [])) {
      const sid = (cost as any).shipment_id;
      if (!costByShipment[sid]) {
        costByShipment[sid] = { planned: 0, actual: 0, lines: 0, allReconciled: true };
      }
      costByShipment[sid].planned += num((cost as any).planned_amount);
      costByShipment[sid].actual += num((cost as any).actual_amount);
      costByShipment[sid].lines += 1;
      if ((cost as any).actual_amount == null || (cost as any).actual_amount < 0) {
        costByShipment[sid].allReconciled = false;
      }
    }

    // 4. Build rows
    const rows: ShipmentProfitLossRow[] = shipments.map((s: any) => {
      const revenue = revenueByShipment[s.id] ?? 0;
      const costs = costByShipment[s.id] ?? { planned: 0, actual: 0, lines: 0, allReconciled: false };
      const costVariance = costs.actual - costs.planned;
      const costVariancePercent = costs.planned > 0 ? (costVariance / costs.planned) * 100 : 0;
      const plannedProfit = revenue - costs.planned;
      const actualProfit = revenue - costs.actual;

      return {
        shipment_id: s.id,
        shipment_code: s.code ?? '',
        customer_name: s.customers?.company_name ?? '',
        supplier_name: s.suppliers?.company_name ?? '',
        status: s.status ?? 'draft',
        commodity: s.commodity ?? '',
        etd: s.etd ?? null,
        eta: s.eta ?? null,
        total_revenue: revenue,
        total_planned_cost: costs.planned,
        total_actual_cost: costs.actual,
        cost_variance: Math.round(costVariance * 100) / 100,
        cost_variance_percent: Math.round(costVariancePercent * 100) / 100,
        planned_profit: Math.round(plannedProfit * 100) / 100,
        actual_profit: Math.round(actualProfit * 100) / 100,
        planned_margin_percent: revenue > 0 ? Math.round((plannedProfit / revenue) * 10000) / 100 : null,
        actual_margin_percent: revenue > 0 ? Math.round((actualProfit / revenue) * 10000) / 100 : null,
        cost_lines: costs.lines,
        all_costs_reconciled: costs.allReconciled && costs.lines > 0,
      };
    });

    return { rows, total: count ?? 0 };
  },
};
