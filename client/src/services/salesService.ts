import { apiFetch } from '../lib/api';
import type { SalesItem, SalesFormState } from '../pages/sales/types';

export const salesService = {
  getSalesItems: (page = 1, limit = 20) => 
    apiFetch<SalesItem[]>(`/sales?page=${page}&limit=${limit}`),

  getSalesItemById: (id: string) => 
    apiFetch<SalesItem>(`/sales/${id}`),

  createSalesItem: (dto: SalesFormState) => 
    apiFetch<SalesItem>('/sales', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateSalesItem: (id: string, dto: Partial<SalesFormState>) => 
    apiFetch<SalesItem>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteSalesItem: (id: string) => 
    apiFetch<void>(`/sales/${id}`, {
      method: 'DELETE',
    }),
};
