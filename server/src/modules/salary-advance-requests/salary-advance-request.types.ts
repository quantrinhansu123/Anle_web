export type ApprovalStatus = 'pending' | 'approved' | 'reconciled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface SalaryAdvanceEmployeeEmbed {
  id: string;
  full_name: string;
  department: string | null;
  position: string | null;
}

export interface SalaryAdvanceRequest {
  id: string;
  reference_code: string;
  employee_id: string;
  advance_date: string;
  amount: number;
  approval_status: ApprovalStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: SalaryAdvanceEmployeeEmbed;
}

export interface CreateSalaryAdvanceRequestDto {
  employee_id: string;
  advance_date: string;
  amount: number;
  approval_status?: ApprovalStatus;
  payment_status?: PaymentStatus;
  notes?: string | null;
}

export interface UpdateSalaryAdvanceRequestDto {
  employee_id?: string;
  advance_date?: string;
  amount?: number;
  approval_status?: ApprovalStatus;
  payment_status?: PaymentStatus;
  notes?: string | null;
}

export interface SalaryAdvanceListFilters {
  search?: string;
  approval_status?: string[];
  payment_status?: string[];
  department?: string[];
  /** Explicit employee UUIDs (multi-select pill); intersected with department/name filters when both set. */
  employee_ids?: string[];
  ref?: string;
  employee_name?: string;
  position?: string;
  department_contains?: string;
  advance_date_from?: string;
  advance_date_to?: string;
}

export interface SalaryAdvanceStats {
  total: number;
  totalAmount: number;
  byApproval: Record<ApprovalStatus, number>;
  byPayment: Record<PaymentStatus, number>;
}
