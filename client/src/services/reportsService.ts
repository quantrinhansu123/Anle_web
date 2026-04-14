import { apiFetch } from '../lib/api';

export interface JobProfitByPerformanceRow {
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

export interface JobProfitByPerformanceResponse {
  rows: JobProfitByPerformanceRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const reportsService = {
  getJobProfitByPerformanceDate(params: { from: string; to: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    sp.set('from', params.from);
    sp.set('to', params.to);
    sp.set('page', String(params.page ?? 1));
    sp.set('limit', String(params.limit ?? 50));
    return apiFetch<JobProfitByPerformanceResponse>(`/reports/job-profit-by-performance-date?${sp.toString()}`);
  },
};
