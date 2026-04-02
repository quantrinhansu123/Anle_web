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
    const {
      full_name,
      department,
      position,
      email,
      phone,
      address,
      password,
      avatar_url
    } = dto;

    const insertData: any = {
      full_name,
      department,
      position,
      email,
      phone,
      address,
      avatar_url
    };

    if (password) {
      insertData.password = await authService.hashPassword(password);
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    const { password: _p, ...rest } = data;
    return rest;
  },

  async update(id: string, dto: UpdateEmployeeDTO) {
    const {
      full_name,
      department,
      position,
      email,
      phone,
      address,
      password,
      avatar_url
    } = dto;

    const updateData: any = {
      full_name,
      department,
      position,
      email,
      phone,
      address,
      avatar_url
    };

    if (password) {
      updateData.password = await authService.hashPassword(password);
    }

    // Remove undefined fields to avoid overwriting with null if not intended
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    const { password: _p, ...rest } = data;
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
