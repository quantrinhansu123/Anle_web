export interface Supplier {
  id: string; // 3 characters, manually entered
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  created_at: string;
}

export interface CreateSupplierDto {
  id: string; // 3 characters
  company_name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
}

export interface UpdateSupplierDto extends Partial<Omit<CreateSupplierDto, 'id'>> {}
