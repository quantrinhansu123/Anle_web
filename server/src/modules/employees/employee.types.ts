export interface Employee {
  id: string;
  full_name: string;
  team?: string; // Legacy
  department?: string; // Legacy
  position?: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  avatar_url?: string;
  created_at?: string;
  role?: string;
  department_code?: string;
  team_code?: string;
  manager_id?: string;
  is_active?: boolean;
  spending_limit?: number;
}

export interface CreateEmployeeDTO {
  full_name: string;
  team?: string;
  department?: string;
  position?: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
  avatar_url?: string;
  role?: string;
  department_code?: string;
  team_code?: string;
  manager_id?: string;
  is_active?: boolean;
  spending_limit?: number;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}
