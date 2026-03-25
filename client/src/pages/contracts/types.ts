export interface Contract {
  id: string;
  customer_id?: string;
  supplier_id?: string;
  pic_id?: string;
  no_contract?: string;
  payment_term?: string;
  type_logistic: boolean;
  type_trading: boolean;
  file_url?: string;
  created_at: string;
  // Relations
  customers?: { company_name: string };
  suppliers?: { company_name: string };
  employees?: { full_name: string };
}

export interface CreateContractDto {
  customer_id?: string;
  supplier_id?: string;
  pic_id?: string;
  no_contract?: string;
  payment_term?: string;
  type_logistic?: boolean;
  type_trading?: boolean;
  file_url?: string;
}

export interface UpdateContractDto extends Partial<CreateContractDto> {}
