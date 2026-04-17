export interface FmsJobProfitByPerformanceRow {
  job_id: string;
  master_job_no: string;
  performance_date: string;
  customer_name: string;
  salesman_name: string;
  pre_tax_sell: number;
  pre_tax_buy: number;
  pre_tax_margin: number;
  vat_sell: number;
  vat_buy: number;
  vat_margin: number;
  total_sell: number;
  total_buy: number;
  total_margin: number;
  margin_percent: number | null;
}

/**
 * Per-shipment profit/loss row.
 * Revenue comes from sales (quotation) items linked to the shipment.
 * Cost comes from shipment_costs (planned + actual).
 * SOP Section III requires this comparison per lot.
 */
export interface ShipmentProfitLossRow {
  shipment_id: string;
  shipment_code: string;
  customer_name: string;
  supplier_name: string;
  status: string;
  commodity: string;
  etd: string | null;
  eta: string | null;
  // Revenue (from sales/quotation items)
  total_revenue: number;
  // Costs
  total_planned_cost: number;
  total_actual_cost: number;
  cost_variance: number;
  cost_variance_percent: number;
  // Profit
  planned_profit: number;
  actual_profit: number;
  planned_margin_percent: number | null;
  actual_margin_percent: number | null;
  // Meta
  cost_lines: number;
  all_costs_reconciled: boolean;
}
