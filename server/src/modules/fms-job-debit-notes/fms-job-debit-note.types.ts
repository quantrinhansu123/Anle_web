export type FmsJobDebitNoteStatus =
  | 'draft'
  | 'sent'
  | 'invoiced'
  | 'partial_invoiced'
  | 'cancel';

export interface FmsJobDebitNoteLine {
  id: string;
  debit_note_id: string;
  sort_order: number;
  service_code: string | null;
  fare: string | null;
  fare_type: string | null;
  fare_name: string | null;
  tax: string | null;
  currency: string | null;
  exchange_rate: number | null;
  unit: string | null;
  qty: number | null;
  rate: number | null;
}

export interface FmsJobDebitNote {
  id: string;
  job_id: string;
  shipment_id: string;
  no_doc: string;
  status: FmsJobDebitNoteStatus;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  lines?: FmsJobDebitNoteLine[];
}

export interface CreateFmsJobDebitNoteDto {
  no_doc: string;
  status?: FmsJobDebitNoteStatus;
  payload?: Record<string, unknown>;
  lines?: Omit<FmsJobDebitNoteLine, 'id' | 'debit_note_id'>[];
}

export type UpdateFmsJobDebitNoteDto = Partial<CreateFmsJobDebitNoteDto>;
