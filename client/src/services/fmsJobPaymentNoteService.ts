import { apiFetch } from '../lib/api';

export interface FmsJobPaymentNoteLineDto {
  sort_order?: number;
  vendor?: string | null;
  service?: string | null;
  fare?: string | null;
  fare_type?: string | null;
  fare_name?: string | null;
  tax?: string | null;
  currency?: string | null;
  exchange_rate?: number | null;
  unit?: string | null;
  qty?: number | null;
  rate?: number | null;
}

export interface FmsJobPaymentNoteDto {
  id: string;
  job_id: string;
  no_doc: string;
  status: 'draft' | 'approved' | 'partial_billed' | 'billed' | 'cancel';
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  lines?: Array<
    FmsJobPaymentNoteLineDto & {
      id: string;
      payment_note_id: string;
    }
  >;
}

export const fmsJobPaymentNoteService = {
  list(jobId: string) {
    return apiFetch<FmsJobPaymentNoteDto[]>(`/jobs/${jobId}/payment-notes`);
  },

  get(jobId: string, pnId: string) {
    return apiFetch<FmsJobPaymentNoteDto>(`/jobs/${jobId}/payment-notes/${pnId}`);
  },

  create(
    jobId: string,
    body: { no_doc: string; status?: string; payload?: Record<string, unknown>; lines?: FmsJobPaymentNoteLineDto[] },
  ) {
    return apiFetch<FmsJobPaymentNoteDto>(`/jobs/${jobId}/payment-notes`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(
    jobId: string,
    pnId: string,
    body: { no_doc?: string; status?: string; payload?: Record<string, unknown>; lines?: FmsJobPaymentNoteLineDto[] },
  ) {
    return apiFetch<FmsJobPaymentNoteDto>(`/jobs/${jobId}/payment-notes/${pnId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
