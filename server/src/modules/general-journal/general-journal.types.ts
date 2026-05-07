export interface GeneralJournalEntry {
  id: string;
  posting_date: string; // YYYY-MM-DD
  voucher_no?: string | null;
  voucher_date?: string | null; // YYYY-MM-DD
  description?: string | null;
  line_no?: number | null;
  account_code?: string | null;
  debit: number;
  credit: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGeneralJournalEntryDto {
  posting_date: string;
  voucher_no?: string | null;
  voucher_date?: string | null;
  description?: string | null;
  line_no?: number | null;
  account_code?: string | null;
  debit?: number;
  credit?: number;
}

export interface UpdateGeneralJournalEntryDto extends Partial<CreateGeneralJournalEntryDto> {}

