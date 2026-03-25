import { apiFetch } from '../lib/api';

export interface Customer {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  created_at: string;
}

export interface CreateCustomerDto {
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
}

export const customerService = {
  getCustomers: () => apiFetch<Customer[]>('/customers'),
  getById: (id: string) => apiFetch<Customer>(`/customers/${id}`),
  createCustomer: (dto: CreateCustomerDto) => 
    apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  updateCustomer: (id: string, dto: Partial<CreateCustomerDto>) =>
    apiFetch<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  deleteCustomer: (id: string) =>
    apiFetch<{ success: boolean }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};
