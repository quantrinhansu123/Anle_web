import { apiFetch } from '../lib/api';

export interface FmsJobDebitNoteLineDto {
  sort_order?: number;
  service_code?: string | null;
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

export interface FmsJobDebitNoteDto {
  id: string;
  job_id: string;
  no_doc: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  lines?: Array<
    FmsJobDebitNoteLineDto & {
      id: string;
      debit_note_id: string;
    }
  >;
}

export const fmsJobDebitNoteService = {
  list(jobId: string) {
    return apiFetch<FmsJobDebitNoteDto[]>(`/jobs/${jobId}/debit-notes`);
  },

  get(jobId: string, dnId: string) {
    return apiFetch<FmsJobDebitNoteDto>(`/jobs/${jobId}/debit-notes/${dnId}`);
  },

  create(jobId: string, body: { no_doc: string; status?: string; payload?: Record<string, unknown>; lines?: FmsJobDebitNoteLineDto[] }) {
    return apiFetch<FmsJobDebitNoteDto>(`/jobs/${jobId}/debit-notes`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(
    jobId: string,
    dnId: string,
    body: { no_doc?: string; status?: string; payload?: Record<string, unknown>; lines?: FmsJobDebitNoteLineDto[] },
  ) {
    return apiFetch<FmsJobDebitNoteDto>(`/jobs/${jobId}/debit-notes/${dnId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
