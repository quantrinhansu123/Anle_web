export interface Employee {
  id: string;
  full_name: string;
  department?: string;
  position?: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface CreateEmployeeDTO {
  full_name: string;
  department?: string;
  position?: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  avatar_url?: string;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}
