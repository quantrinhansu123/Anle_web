import { apiFetch } from '../lib/api';
import type { AccountingDashboardSummary } from '../pages/accounting-dashboard/types';

export const accountingDashboardService = {
  getSummary: () => apiFetch<AccountingDashboardSummary>('/accounting-dashboard/summary'),
};
