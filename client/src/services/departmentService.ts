import { apiFetch } from '../lib/api';

export interface Department {
  code: string;
  name: string;
  name_vi?: string;
}

export interface Team {
  code: string;
  name: string;
  name_vi?: string;
  department_code: string;
}

export const departmentService = {
  getDepartments: () => apiFetch<Department[]>('/departments'),
  getTeams: () => apiFetch<Team[]>('/departments/teams'),
  getTeamsByDepartment: (code: string) => apiFetch<Team[]>(`/departments/${code}/teams`),
};
