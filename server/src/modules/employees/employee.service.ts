import { supabase } from '../../config/supabase';
import { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from './employee.types';
import { AppError } from '../../middlewares/error.middleware';
import { authService } from '../auth/auth.service';

const POSITION_VI_TO_EN: Record<string, string> = {
  'Giám Đốc': 'Director',
  'Giám đốc': 'Director',
  'Phó Giám Đốc': 'Vice Director',
  'Phó Giám đốc': 'Vice Director',
  'Phó giám đốc': 'Vice Director',
  'Deputy Director': 'Vice Director',
  'Assistant Director': 'Vice Director',
  'Cố vấn - Trợ lí': 'Advisor - Assistant',
  'Cố vấn - Trợ lý': 'Advisor - Assistant',
  'Cố Vấn - Trợ Lí': 'Advisor - Assistant',
  'Kế Toán Nội Bộ': 'Internal Accountant',
  'Kế toán nội bộ': 'Internal Accountant',
  'Lao Công': 'Cleaner',
  'Lao công': 'Cleaner',
  'Hành Chính- Pháp Chế': 'Administration - Legal',
  'Hành Chính - Pháp Chế': 'Administration - Legal',
  'Hành chính - Pháp chế': 'Administration - Legal',
  'Hành Chính-Pháp Chế': 'Administration - Legal',
  'Thủ Quỹ': 'Cashier',
  'Thủ quỹ': 'Cashier',
  'Kế Toán Thuế': 'Tax Accountant',
  'Kế toán thuế': 'Tax Accountant',
  'Mua Hàng': 'Purchasing',
  'Mua hàng': 'Purchasing',
  'Chứng Từ': 'Documentation',
  'Chứng từ': 'Documentation',
  'Hiện Trường': 'Field Operations',
  'Hiện trường': 'Field Operations',
};

function translatePositionToEnglish(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  return POSITION_VI_TO_EN[trimmed] || trimmed;
}

/** FK columns reject '' — use null when cleared / not selected. */
function nullIfEmpty(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export const employeeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select('*, departments:department_code(name, name_vi), teams:team_code(name, name_vi)')
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

  async resolveDepartmentName(departmentCode?: string | null, fallback?: string | null) {
    if (!departmentCode) return fallback ?? undefined;
    const { data } = await supabase
      .from('departments')
      .select('name')
      .eq('code', departmentCode)
      .maybeSingle();
    return data?.name || fallback || undefined;
  },

  async create(dto: CreateEmployeeDTO) {
    const {
      full_name,
      team,
      department,
      position,
      email,
      phone,
      address,
      password,
      avatar_url,
      role,
      department_code,
      team_code,
      manager_id,
      is_active,
      spending_limit
    } = dto;

    const resolvedDepartment = await this.resolveDepartmentName(department_code, department);

    const insertData: any = {
      full_name,
      team, // legacy
      department: resolvedDepartment, // legacy free-text, keep English from departments.name
      position,
      email,
      phone,
      address,
      avatar_url,
      role,
      department_code: nullIfEmpty(department_code),
      team_code: nullIfEmpty(team_code),
      manager_id: nullIfEmpty(manager_id),
      is_active,
      spending_limit
    };

    if (password) {
      insertData.password = await authService.hashPassword(password);
    }

    if (typeof insertData.position === 'string') {
      insertData.position = translatePositionToEnglish(insertData.position);
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
      team,
      department,
      position,
      email,
      phone,
      address,
      password,
      avatar_url,
      role,
      department_code,
      team_code,
      manager_id,
      is_active,
      spending_limit
    } = dto;

    const resolvedDepartment =
      department_code !== undefined
        ? await this.resolveDepartmentName(department_code, department)
        : department;

    const updateData: any = {
      full_name,
      team, // legacy
      department: resolvedDepartment, // legacy free-text, keep English from departments.name
      position,
      email,
      phone,
      address,
      avatar_url,
      role,
      department_code: nullIfEmpty(department_code),
      team_code: nullIfEmpty(team_code),
      manager_id: nullIfEmpty(manager_id),
      is_active,
      spending_limit
    };

    if (password) {
      updateData.password = await authService.hashPassword(password);
    }

    if (typeof updateData.position === 'string') {
      updateData.position = translatePositionToEnglish(updateData.position);
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
