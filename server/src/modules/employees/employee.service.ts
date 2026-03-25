import { supabase } from '@/config/supabase';
import { Employee } from './employee.types';
import { AppError } from '@/middlewares/error.middleware';

export const employeeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    return data ?? [];
  }
};
