import { apiFetch } from '../lib/api';

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

export type CreateGeneralJournalEntryDto = Omit<GeneralJournalEntry, 'id' | 'created_at' | 'updated_at'>;
export type UpdateGeneralJournalEntryDto = Partial<CreateGeneralJournalEntryDto>;

export const generalJournalService = {
  list: (page = 1, limit = 500) => apiFetch<GeneralJournalEntry[]>(`/general-journal?page=${page}&limit=${limit}`),
  create: (dto: CreateGeneralJournalEntryDto) =>
    apiFetch<GeneralJournalEntry>('/general-journal', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateGeneralJournalEntryDto) =>
    apiFetch<GeneralJournalEntry>(`/general-journal/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string) => apiFetch<void>(`/general-journal/${id}`, { method: 'DELETE' }),
};

