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
  sales_staff?: string;
  sales_team?: string;
  sales_department?: string;
  company_id_number?: string;
  industry?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
