import { apiFetch } from '../lib/api';

export interface Supplier {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  created_at: string;
  shipments?: any[];
  payment_requests?: any[];
  debit_notes?: any[];
}

export interface CreateSupplierDto {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
}

export const supplierService = {
  getSuppliers: (page = 1, limit = 1000) => apiFetch<Supplier[]>(`/suppliers?page=${page}&limit=${limit}`),
  getById: (id: string) => apiFetch<Supplier>(`/suppliers/${id}`),
  getSupplierDetails: (id: string) => apiFetch<Supplier>(`/suppliers/${id}/details`),
  createSupplier: (dto: CreateSupplierDto) => 
    apiFetch<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateSupplier: (id: string, dto: Partial<CreateSupplierDto>) =>
    apiFetch<Supplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  deleteSupplier: (id: string) =>
    apiFetch<{ success: boolean }>(`/suppliers/${id}`, {
      method: 'DELETE',
    }),
};
