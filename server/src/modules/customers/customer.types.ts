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

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
