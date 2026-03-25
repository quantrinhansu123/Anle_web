import { apiFetch } from '../lib/api';

export interface Employee {
  id: string;
  full_name: string;
  email?: string;
}

export const employeeService = {
  getEmployees: () => 
    apiFetch<Employee[]>('/employees'),
};
