import { apiFetch } from '../lib/api';
import type { Sales, SalesFormState } from '../pages/sales/types';

export const salesService = {
  getSalesItems: (page = 1, limit = 20) => 
    apiFetch<Sales[]>(`/sales?page=${page}&limit=${limit}`),

  getSalesItemById: (id: string) => 
    apiFetch<Sales>(`/sales/${id}`),

  createSalesItem: (dto: SalesFormState) => 
    apiFetch<Sales>('/sales', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateSalesItem: (id: string, dto: Partial<SalesFormState>) => 
    apiFetch<Sales>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteSalesItem: (id: string) => 
    apiFetch<void>(`/sales/${id}`, {
      method: 'DELETE',
    }),

  confirmQuotation: (id: string) =>
    apiFetch<Sales>(`/sales/${id}/confirm`, {
      method: 'POST',
    }),

  markQuotationWon: (id: string) =>
    apiFetch<Sales>(`/sales/${id}/mark-won`, {
      method: 'POST',
    }),

  markQuotationLost: (id: string) =>
    apiFetch<Sales>(`/sales/${id}/mark-lost`, {
      method: 'POST',
    }),

  sendQuotationEmail: (id: string, payload: { to_email?: string; subject?: string; content_snapshot?: string } = {}) =>
    apiFetch<{ quotation: Sales }>(`/sales/${id}/send-email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createJobFromQuotation: (id: string, shipment?: Record<string, unknown>) =>
    apiFetch<{ shipment: { id: string; code?: string }; quotation: Sales; already_created: boolean }>(`/sales/${id}/create-job`, {
      method: 'POST',
      body: JSON.stringify(shipment ? { shipment } : {}),
    }),
};
