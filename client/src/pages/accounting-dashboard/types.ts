export interface AccountingDashboardMetric {
  key: string;
  count: number;
  amount: number;
}

export interface AccountingDashboardChartBar {
  label: string;
  value: number;
}

export interface AccountingDashboardBankCard {
  id: string;
  displayName: string;
  subtitle: string | null;
  unpaidTotal: number;
  sparkline: number[];
}

export interface AccountingDashboardSummary {
  generatedAt: string;
  customerInvoices: {
    metrics: AccountingDashboardMetric[];
    chartBars: AccountingDashboardChartBar[];
  };
  vendorBills: {
    metrics: AccountingDashboardMetric[];
    chartBars: AccountingDashboardChartBar[];
  };
  miscellaneous: {
    metrics: AccountingDashboardMetric[];
    chartBars: AccountingDashboardChartBar[];
  };
  cash: {
    metrics: AccountingDashboardMetric[];
    sparkline: number[];
  };
  bankAccounts: AccountingDashboardBankCard[];
}
