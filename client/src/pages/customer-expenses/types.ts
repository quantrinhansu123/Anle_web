export type CustomerExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'under_validation'
  | 'approved'
  | 'completed'
  | 'refused';

export type CustomerExpensePaidBy = 'employee_reimburse' | 'company' | 'third_party';

export interface CustomerExpenseEmployeeEmbed {
  id: string;
  full_name: string;
  department: string | null;
  position: string | null;
}

export interface CustomerExpenseCustomerEmbed {
  id: string;
  company_name: string;
}

export interface CustomerExpenseJobEmbed {
  id: string;
  master_job_no: string;
}

export interface CustomerExpense {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  currency: string;
  tax_amount: number;
  status: CustomerExpenseStatus;
  paid_by: CustomerExpensePaidBy;
  employee_id: string;
  customer_id: string | null;
  job_id: string | null;
  supplier: string | null;
  category: string | null;
  bill_reference: string | null;
  account_label: string | null;
  company_name_snapshot: string | null;
  pay_for: string | null;
  service: string | null;
  notes: string | null;
  create_invoice: boolean;
  created_at: string;
  updated_at: string;
  employee?: CustomerExpenseEmployeeEmbed;
  customer?: CustomerExpenseCustomerEmbed | null;
  job?: CustomerExpenseJobEmbed | null;
}

export interface CustomerExpenseSummaryBucket {
  count: number;
  totalAmount: number;
}

export interface CustomerExpenseStatusBreakdown {
  status: CustomerExpenseStatus;
  count: number;
  totalAmount: number;
}

export interface CustomerExpenseMonthPoint {
  month: string;
  totalAmount: number;
  count: number;
}

export interface CustomerExpenseStats {
  summary: {
    submitted: CustomerExpenseSummaryBucket;
    underValidation: CustomerExpenseSummaryBucket;
    completed: CustomerExpenseSummaryBucket;
  };
  byStatus: CustomerExpenseStatusBreakdown[];
  byMonth: CustomerExpenseMonthPoint[];
  totalCount: number;
  grandTotalAmount: number;
}

export interface CustomerExpenseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  customer_id?: string[];
  employee_id?: string[];
  job_id?: string[];
  expense_date_from?: string;
  expense_date_to?: string;
}

/** Form + dialog state (aligned with API fields). */
export interface CustomerExpenseFormState {
  id?: string;
  expense_date: string;
  description: string;
  amount: number;
  currency: string;
  tax_amount: number;
  status: CustomerExpenseStatus;
  paid_by: CustomerExpensePaidBy;
  employee_id: string;
  customer_id: string;
  job_id: string;
  supplier: string;
  category: string;
  bill_reference: string;
  account_label: string;
  company_name_snapshot: string;
  pay_for: string;
  service: string;
  notes: string;
  create_invoice: boolean;
}
