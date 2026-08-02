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
  'Cố vấn - Trợ lí': 'Advisor Assistant',
  'Cố vấn - Trợ lý': 'Advisor Assistant',
  'Cố Vấn - Trợ Lí': 'Advisor Assistant',
  'Cố vấn trợ lý': 'Advisor Assistant',
  'Cố vấn trợ lí': 'Advisor Assistant',
  'Cố Vấn Trợ Lý': 'Advisor Assistant',
  'Advisor - Assistant': 'Advisor Assistant',
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
  'Công Nhân': 'Worker',
  'Công nhân': 'Worker',
  'Thủ Kho': 'Warehouse Keeper',
  'Thủ kho': 'Warehouse Keeper',
};

const ROLE_TO_STANDARD: Record<string, string> = {
  admin: 'admin',
  Admin: 'admin',
  senior: 'senior',
  'Cao cấp': 'senior',
  'Cao Cấp': 'senior',
  'cao cấp': 'senior',
  intermediate: 'intermediate',
  'Trung cấp': 'intermediate',
  'Trung Cấp': 'intermediate',
  'trung cấp': 'intermediate',
  junior: 'junior',
  'Sơ cấp': 'junior',
  'Sơ Cấp': 'junior',
  'sơ cấp': 'junior',
  collaborator: 'collaborator',
  'Cộng tác viên': 'collaborator',
  'Cộng Tác Viên': 'collaborator',
  CTV: 'collaborator',
  ctv: 'collaborator',
  // Legacy system roles
  ceo: 'admin',
  director: 'senior',
  manager: 'intermediate',
  senior_staff: 'senior',
  staff: 'junior',
};

const DEPT_NAME_TO_CODE: Record<string, string> = {
  'Board of Directors': 'bod',
  'Ban Giám Đốc': 'bod',
  'Ban Giám đốc': 'bod',
  'Administration - Accounting': 'finance',
  'Hành Chính - Kế Toán': 'finance',
  'Hành chính - Kế toán': 'finance',
  Logistics: 'logistics',
  Sales: 'sales',
  'Kinh Doanh': 'sales',
  'Kinh doanh': 'sales',
  Warehouse: 'warehouse',
  'Kho bãi': 'warehouse',
  'Kho Bãi': 'warehouse',
  Finance: 'finance',
  BOD: 'bod',
};

function translatePositionToEnglish(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = normalizeKey(value);
  if (!trimmed) return trimmed;
  return POSITION_VI_TO_EN[trimmed] || trimmed;
}

function translateRoleToStandard(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = normalizeKey(value);
  if (!trimmed) return trimmed;
  return ROLE_TO_STANDARD[trimmed] || trimmed;
}

function normalizeKey(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
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
    // Detach nullable FKs that block employee delete (no ON DELETE SET NULL in DB).
    const nullableClears: { table: string; column: string }[] = [
      { table: 'contracts', column: 'pic_id' },
      { table: 'purchasing_items', column: 'pic_id' },
      { table: 'purchasing_items', column: 'created_by_id' },
      { table: 'purchasing_items', column: 'approved_by_id' },
      { table: 'shipments', column: 'pic_id' },
      { table: 'shipments', column: 'salesperson_id' },
      { table: 'shipments', column: 'product_pic_id' },
      { table: 'sales', column: 'sales_person_id' },
      { table: 'sales', column: 'sent_by' },
      { table: 'shipment_documents', column: 'verified_by_id' },
      { table: 'customer_notes', column: 'created_by' },
      { table: 'employees', column: 'manager_id' },
      { table: 'approval_requests', column: 'requester_id' },
      { table: 'approval_requests', column: 'current_approver_id' },
      { table: 'approval_requests', column: 'final_approver_id' },
      { table: 'approval_steps', column: 'approver_id' },
    ];

    const criticalTables = new Set(['contracts', 'purchasing_items', 'shipments', 'employees']);

    for (const { table, column } of nullableClears) {
      const { data: cleared, error: clearErr } = await supabase
        .from(table)
        .update({ [column]: null })
        .eq(column, id)
        .select('id');

      if (clearErr) {
        const missing = /does not exist|Could not find|schema cache/i.test(clearErr.message);
        if (!missing && criticalTables.has(table)) {
          throw new AppError(
            `Cannot detach employee from ${table}.${column}: ${clearErr.message}`,
            400,
          );
        }
        if (!missing) {
          console.warn(`detach ${table}.${column}:`, clearErr.message);
        }
        continue;
      }

      if (cleared && cleared.length > 0) {
        console.log(`detached ${cleared.length} row(s) on ${table}.${column}`);
      }
    }

    // Child rows with ON DELETE RESTRICT + NOT NULL employee_id
    for (const table of ['salary_advance_requests', 'customer_expenses'] as const) {
      const { error: delChildErr } = await supabase.from(table).delete().eq('employee_id', id);
      if (delChildErr && !/does not exist|Could not find|schema cache/i.test(delChildErr.message)) {
        throw new AppError(
          `Cannot remove related ${table} for this employee: ${delChildErr.message}`,
          400,
        );
      }
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      if (/foreign key constraint/i.test(error.message)) {
        throw new AppError(
          `Cannot delete this employee because related records still reference them (${error.message}).`,
          400,
        );
      }
      throw new AppError(error.message, 400);
    }
    return true;
  },

  /**
   * Normalize employee catalog fields to English standards:
   * position, role, department free-text, and department_code when resolvable.
   */
  async matchCatalogData() {
    const { data: depts, error: deptErr } = await supabase
      .from('departments')
      .select('code, name');
    if (deptErr) throw new AppError(deptErr.message, 400);

    const deptNameByCode = new Map<string, string>();
    for (const d of depts || []) {
      deptNameByCode.set(d.code, d.name);
    }

    const { data: rows, error } = await supabase
      .from('employees')
      .select('id, position, role, department, department_code');
    if (error) throw new AppError(error.message, 400);

    let updated = 0;
    let skipped = 0;
    const changes: { id: string; fields: string[] }[] = [];

    for (const row of rows || []) {
      const patch: Record<string, string | null> = {};
      const changedFields: string[] = [];

      const nextPosition = translatePositionToEnglish(row.position);
      if (nextPosition !== undefined && nextPosition !== (row.position || '')) {
        patch.position = nextPosition;
        changedFields.push('position');
      }

      const nextRole = translateRoleToStandard(row.role);
      if (nextRole !== undefined && nextRole !== (row.role || '')) {
        patch.role = nextRole;
        changedFields.push('role');
      }

      let nextDeptCode = nullIfEmpty(row.department_code) ?? null;
      if (!nextDeptCode && row.department) {
        const mapped = DEPT_NAME_TO_CODE[normalizeKey(row.department)];
        if (mapped) {
          nextDeptCode = mapped;
          patch.department_code = mapped;
          changedFields.push('department_code');
        }
      }

      if (nextDeptCode && deptNameByCode.has(nextDeptCode)) {
        const canonicalDept = deptNameByCode.get(nextDeptCode)!;
        if (canonicalDept !== (row.department || '')) {
          patch.department = canonicalDept;
          changedFields.push('department');
        }
      } else if (row.department) {
        const mappedCode = DEPT_NAME_TO_CODE[normalizeKey(row.department)];
        if (mappedCode && deptNameByCode.has(mappedCode)) {
          const canonicalDept = deptNameByCode.get(mappedCode)!;
          if (canonicalDept !== row.department) {
            patch.department = canonicalDept;
            changedFields.push('department');
          }
          if (!row.department_code) {
            patch.department_code = mappedCode;
            changedFields.push('department_code');
          }
        }
      }

      if (changedFields.length === 0) {
        skipped++;
        continue;
      }

      const { error: upErr } = await supabase
        .from('employees')
        .update(patch)
        .eq('id', row.id);

      if (upErr) throw new AppError(upErr.message, 400);
      updated++;
      changes.push({ id: row.id, fields: [...new Set(changedFields)] });
    }

    return {
      total: (rows || []).length,
      updated,
      skipped,
      changes,
    };
  },
};
