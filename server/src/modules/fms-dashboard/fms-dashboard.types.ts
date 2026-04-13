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

export interface FmsDashboardPayload {
  summary: FmsDashboardSummary;
  shipmentStatus: FmsShipmentStatusRow[];
  monthly: FmsMonthlyRow[];
  revenueByService: FmsServiceRevenueRow[];
}
