export interface BusinessDashboardMoneyRow {
  name: string;
  revenueVnd: number;
}

export interface BusinessDashboardCountRow {
  name: string;
  count: number;
}

export interface BusinessDashboardPayload {
  salesRevenueByPerson: BusinessDashboardMoneyRow[];
  customerRevenue: BusinessDashboardMoneyRow[];
  revenueByService: BusinessDashboardMoneyRow[];
  customersByShipmentStatus: BusinessDashboardCountRow[];
}
