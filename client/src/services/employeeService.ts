import { apiFetch } from '../lib/api';

export interface Employee {
  id: string;
  full_name: string;
  team?: string;
  department?: string;
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
  departments?: { name: string; name_vi: string };
  teams?: { name: string; name_vi: string };
  shipments?: any[];
  contracts?: any[];
}

export type CreateEmployeeDTO = Omit<Employee, 'id' | 'created_at' | 'shipments' | 'contracts'>;
export type UpdateEmployeeDTO = Partial<CreateEmployeeDTO>;

export const employeeService = {
  getEmployees: () => apiFetch<Employee[]>('/employees'),
  getEmployee: (id: string) => apiFetch<Employee>(`/employees/${id}`),
  getEmployeeDetails: (id: string) => apiFetch<Employee>(`/employees/${id}/details`),
  createEmployee: (dto: CreateEmployeeDTO) => apiFetch<Employee>('/employees', {
    method: 'POST',
    body: JSON.stringify(dto)
  }),
  updateEmployee: (id: string, dto: UpdateEmployeeDTO) => apiFetch<Employee>(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto)
  }),
  deleteEmployee: (id: string) => apiFetch<void>(`/employees/${id}`, {
    method: 'DELETE'
  }),
};
