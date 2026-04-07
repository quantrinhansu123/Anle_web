import { apiFetch } from '../lib/api';

export interface Customer {
  id: string;
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  code?: string;
  rank?: number;
  credit_limit?: number;
  credit_term_days?: number;
  sales_staff?: string;
  sales_team?: string;
  sales_department?: string;
  company_id_number?: string;
  industry?: string;
  created_at: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  full_name: string;
  position?: string;
  email?: string;
  phone?: string;
  department?: string;
  created_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  created_by?: string;
  author?: { full_name: string };
  content: string;
  created_at: string;
}

export interface CustomerDetails extends Customer {
  contacts: CustomerContact[];
  notes: CustomerNote[];
  shipments: any[]; // Adjust to use Shipment type
  sales: any[]; // Adjust to use Sale type
}

export interface CreateCustomerDto {
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  code?: string;
  rank?: number;
  credit_limit?: number;
  credit_term_days?: number;
}

export const customerService = {
  getCustomers: () => apiFetch<Customer[]>('/customers'),
  getById: (id: string) => apiFetch<Customer>(`/customers/${id}`),
  getCustomerDetails: (id: string) => apiFetch<CustomerDetails>(`/customers/${id}/details`),
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
