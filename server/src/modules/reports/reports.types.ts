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
