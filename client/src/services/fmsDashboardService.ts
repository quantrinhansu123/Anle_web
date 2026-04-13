import { apiFetch } from '../lib/api';

export interface FmsDashboardSummary {
  totalRevenueVnd: number;
  totalCostVnd: number;
  customerCount: number;
  totalShipments: number;
  grossProfitVnd: number;
}

export interface FmsShipmentStatusRow {
  status: string;
  count: number;
}

export interface FmsMonthlyRow {
  month: string;
  monthStart: string;
  volumeTeu: number;
  revenueVnd: number;
}

export interface FmsServiceRevenueRow {
  name: string;
  revenueVnd: number;
}

export interface FmsDashboardData {
  summary: FmsDashboardSummary;
  shipmentStatus: FmsShipmentStatusRow[];
  monthly: FmsMonthlyRow[];
  revenueByService: FmsServiceRevenueRow[];
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const fmsDashboardService = {
  getDashboard: (range: { from: Date; to: Date }) => {
    const qs = new URLSearchParams({ from: toYmd(range.from), to: toYmd(range.to) });
    return apiFetch<FmsDashboardData>(`/fms-dashboard?${qs.toString()}`);
  },
};
