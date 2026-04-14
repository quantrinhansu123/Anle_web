export type FmsJobPaymentNoteStatus =
  | 'draft'
  | 'approved'
  | 'partial_billed'
  | 'billed'
  | 'cancel';

export interface FmsJobPaymentNoteLine {
  id: string;
  payment_note_id: string;
  sort_order: number;
  vendor: string | null;
  service: string | null;
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

export interface FmsJobPaymentNote {
  id: string;
  job_id: string;
  no_doc: string;
  status: FmsJobPaymentNoteStatus;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  lines?: FmsJobPaymentNoteLine[];
}

export interface CreateFmsJobPaymentNoteDto {
  no_doc: string;
  status?: FmsJobPaymentNoteStatus;
  payload?: Record<string, unknown>;
  lines?: Omit<FmsJobPaymentNoteLine, 'id' | 'payment_note_id'>[];
}

export type UpdateFmsJobPaymentNoteDto = Partial<CreateFmsJobPaymentNoteDto>;
