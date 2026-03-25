import { apiFetch } from '../lib/api';
import type { DebitNote, CreateDebitNoteDto, UpdateDebitNoteDto } from '../pages/debit-notes/types';

export const debitNoteService = {
  getDebitNotes: (page = 1, limit = 20) =>
    apiFetch<DebitNote[]>(`/debit-notes?page=${page}&limit=${limit}`),

  getDebitNoteById: (id: string) =>
    apiFetch<DebitNote>(`/debit-notes/${id}`),

  createDebitNote: (dto: CreateDebitNoteDto) =>
    apiFetch<DebitNote>('/debit-notes', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateDebitNote: (id: string, dto: UpdateDebitNoteDto) =>
    apiFetch<DebitNote>(`/debit-notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteDebitNote: (id: string) =>
    apiFetch<void>(`/debit-notes/${id}`, {
      method: 'DELETE',
    }),
};
