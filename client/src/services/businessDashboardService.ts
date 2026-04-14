import { apiFetch } from '../lib/api';

export interface BusinessDashboardMoneyRow {
  name: string;
  revenueVnd: number;
}

export interface BusinessDashboardCountRow {
  name: string;
  count: number;
}

export interface BusinessDashboardData {
  salesRevenueByPerson: BusinessDashboardMoneyRow[];
  customerRevenue: BusinessDashboardMoneyRow[];
  revenueByService: BusinessDashboardMoneyRow[];
  customersByShipmentStatus: BusinessDashboardCountRow[];
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const businessDashboardService = {
  getDashboard: (range: { from: Date; to: Date }) => {
    const to = range.to ?? range.from;
    const qs = new URLSearchParams({ from: toYmd(range.from), to: toYmd(to) });
    return apiFetch<BusinessDashboardData>(`/business-dashboard?${qs.toString()}`);
  },
};
