export type FmsJobInvoiceStatus = 'draft' | 'posted';
export type FmsJobInvoicePaymentStatus = 'unpaid' | 'paid' | 'partial';

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

export interface JobInvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  payment_status?: string[];
  job_id?: string[];
}
