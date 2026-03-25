import { supabase } from '../../config/supabase';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from './employee.types';
import { AppError } from '../../middlewares/error.middleware';
import { authService } from '../auth/auth.service';

export const employeeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw new AppError(error.message, 400);
    // Remove individual passwords from list
    return (data ?? []).map((e: Employee) => {
       const { password, ...rest } = e;
       return rest;
    });
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    const { password, ...rest } = data;
    return rest;
  },

  async getByIdWithRelations(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *, 
        shipments(*, customers(company_name), suppliers(company_name)), 
        contracts(*, customers(company_name))
      `)
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);
    const { password, ...rest } = data;
    return rest;
  },

  async create(dto: CreateEmployeeDTO) {
    const insertData = { ...dto };
    if (insertData.password) {
      insertData.password = await authService.hashPassword(insertData.password);
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    const { password, ...rest } = data;
    return rest;
  },

  async update(id: string, dto: UpdateEmployeeDTO) {
    const updateData = { ...dto };
    if (updateData.password) {
      updateData.password = await authService.hashPassword(updateData.password);
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    const { password, ...rest } = data;
    return rest;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw new AppError(error.message, 400);
    return true;
  }
};
