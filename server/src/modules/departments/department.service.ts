import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';

export interface Department {
  code: string;
  name: string;
  name_vi?: string;
  description?: string;
  parent_code?: string;
  sort_order?: number;
}

export interface Team {
  code: string;
  name: string;
  name_vi?: string;
  department_code: string;
  sort_order?: number;
}

export const departmentService = {
  async getAllDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  },

  async getTeamsByDepartment(departmentCode: string) {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('department_code', departmentCode)
      .order('sort_order', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  },

  async getAllTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('*, departments(name, name_vi)')
      .order('sort_order', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return data || [];
  }
};
