import { apiFetch } from '../lib/api';

export type CustomerStatus = 'new' | 'follow_up' | 'quotation_sent' | 'meeting' | 'won' | 'lost';

export const CUSTOMER_STATUS_VALUES: CustomerStatus[] = [
  'new',
  'follow_up',
  'quotation_sent',
  'meeting',
  'won',
  'lost'
];

export interface Customer {
  id: string;
  company_name: string;
  local_name?: string;
  english_name?: string;
  customer_group?: string;
  customer_source?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  office_address?: string;
  bl_address?: string;
  country?: string;
  state_province?: string;
  customer_class?: string;
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
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  customer_id: string;
  // Add other shipment fields as needed
}

export interface Sale {
  id: string;
  customer_id: string;
  // Add other sale fields as needed
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
  shipments: Shipment[];
  sales: Sale[];
}

export interface CreateCustomerDto {
  company_name: string;
  local_name?: string;
  english_name?: string;
  customer_group?: string;
  customer_source?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  office_address?: string;
  bl_address?: string;
  country?: string;
  state_province?: string;
  customer_class?: string;
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
  status?: CustomerStatus;
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
