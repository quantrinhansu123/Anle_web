import { apiFetch, apiFetchPaginated } from '../lib/api';
import type { FmsJobInvoiceListItem, JobInvoiceListQuery } from '../pages/invoices/types';

export interface FmsJobInvoiceDto {
  id: string;
  job_id: string;
  debit_note_id: string;
  invoice_no: string;
  status: 'draft' | 'posted';
  payment_status: 'unpaid' | 'paid' | 'partial';
  grand_total: number | null;
  lines: unknown[];
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function buildInvoiceListQuery(q: JobInvoiceListQuery): string {
  const p = new URLSearchParams();
  if (q.page != null) p.set('page', String(q.page));
  if (q.limit != null) p.set('limit', String(q.limit));
  if (q.search?.trim()) p.set('search', q.search.trim());
  q.status?.forEach((s) => p.append('status', s));
  q.payment_status?.forEach((s) => p.append('payment_status', s));
  q.job_id?.forEach((s) => p.append('job_id', s));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export interface RecordPaymentBody {
  journal?: string | null;
  payment_method?: string | null;
  amount: number;
  payment_date?: string | null;
  memo?: string | null;
}

export const fmsJobInvoiceService = {
  /** Cross-job invoice list (paginated). */
  listAll: (query: JobInvoiceListQuery = {}) =>
    apiFetchPaginated<FmsJobInvoiceListItem>(`/jobs/invoices${buildInvoiceListQuery(query)}`),

  list(jobId: string) {
    return apiFetch<FmsJobInvoiceDto[]>(`/jobs/${jobId}/invoices`);
  },

  get(jobId: string, invoiceId: string) {
    return apiFetch<FmsJobInvoiceDto>(`/jobs/${jobId}/invoices/${invoiceId}`);
  },

  create(
    jobId: string,
    body: {
      debit_note_id: string;
      number_series: 'INV' | 'BILL';
      status?: 'draft' | 'posted';
      grand_total?: number | null;
      lines?: unknown[];
      payload?: Record<string, unknown>;
    },
  ) {
    return apiFetch<FmsJobInvoiceDto>(`/jobs/${jobId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(
    jobId: string,
    invoiceId: string,
    body: Partial<{
      invoice_no: string;
      status: 'draft' | 'posted';
      grand_total: number | null;
      lines: unknown[];
      payload: Record<string, unknown>;
      payment_status: 'unpaid' | 'paid' | 'partial';
    }>,
  ) {
    return apiFetch<FmsJobInvoiceDto>(`/jobs/${jobId}/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  recordPayment(jobId: string, invoiceId: string, body: RecordPaymentBody) {
    return apiFetch<{ paymentResult: unknown; invoice: FmsJobInvoiceDto }>(
      `/jobs/${jobId}/invoices/${invoiceId}/record-payment`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },
};
