export type CustomerStatus = 'new' | 'follow_up' | 'quotation_sent' | 'meeting' | 'lost';

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

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
