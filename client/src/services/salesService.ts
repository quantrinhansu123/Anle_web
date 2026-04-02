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
};
