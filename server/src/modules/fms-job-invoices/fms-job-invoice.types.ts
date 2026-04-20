export type FmsJobInvoiceStatus = 'draft' | 'posted';
export type FmsJobInvoicePaymentStatus = 'unpaid' | 'paid' | 'partial';

export interface FmsJobInvoice {
  id: string;
  job_id: string;
  shipment_id: string;
  debit_note_id: string;
  invoice_no: string;
  status: FmsJobInvoiceStatus;
  payment_status: FmsJobInvoicePaymentStatus;
  grand_total: number | null;
  lines: unknown[];
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type FmsJobInvoiceNumberSeries = 'INV' | 'BILL';

export interface CreateFmsJobInvoiceDto {
  debit_note_id: string;
  number_series: FmsJobInvoiceNumberSeries;
  status?: FmsJobInvoiceStatus;
  grand_total?: number | null;
  lines?: unknown[];
  payload?: Record<string, unknown>;
}

export type UpdateFmsJobInvoiceDto = Partial<{
  invoice_no: string;
  status: FmsJobInvoiceStatus;
  grand_total: number | null;
  lines: unknown[];
  payload: Record<string, unknown>;
  payment_status: FmsJobInvoicePaymentStatus;
}>;

export interface RecordFmsJobInvoicePaymentDto {
  journal?: string | null;
  payment_method?: string | null;
  amount: number;
  payment_date?: string | null;
  memo?: string | null;
}

export interface FmsJobInvoiceListFilters {
  search?: string;
  status?: string[];
  payment_status?: string[];
  job_id?: string[];
}

/** Flattened row for global invoice list UI. */
export interface FmsJobInvoiceListItem {
  id: string;
  job_id: string;
  debit_note_id: string;
  invoice_no: string;
  status: FmsJobInvoiceStatus;
  payment_status: FmsJobInvoicePaymentStatus;
  grand_total: number | null;
  created_at: string;
  updated_at: string;
  master_job_no: string | null;
  customer_name: string | null;
  debit_note_no: string | null;
  invoice_date: string | null;
  due_date: string | null;
  original_invoice_no: string | null;
  currency: string;
  untaxed_amount: number;
  tax_amount: number;
}
