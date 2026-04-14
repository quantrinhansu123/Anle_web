import { supabase } from '../../config/supabase';
import type {
  CreateSalaryAdvanceRequestDto,
  SalaryAdvanceListFilters,
  SalaryAdvanceRequest,
  SalaryAdvanceStats,
  UpdateSalaryAdvanceRequestDto,
} from './salary-advance-request.types';

const SELECT_LIST =
  '*, employee:employees(id, full_name, department, position)';

function parseCsvParam(v: unknown): string[] | undefined {
  if (v == null || v === '') return undefined;
  if (Array.isArray(v))
    return v.flatMap((s) => String(s).split(',')).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export class SalaryAdvanceRequestService {
  private async nextReferenceCode(): Promise<string> {
    const { data, error } = await supabase
      .from('salary_advance_requests')
      .select('reference_code')
      .like('reference_code', 'AD%');

    if (error) throw error;
    let max = 0;
    for (const row of data ?? []) {
      const code = row.reference_code as string;
      const m = /^AD(\d+)$/.exec(code);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }
    const next = max + 1;
    return `AD${String(next).padStart(6, '0')}`;
  }

  /** Employees matching all of the optional text / department filters (AND). */
  private async resolveEmployeeIdsAnd(
    f: SalaryAdvanceListFilters,
  ): Promise<string[] | null | 'EMPTY'> {
    const has =
      !!f.employee_name?.trim() ||
      !!f.position?.trim() ||
      !!f.department_contains?.trim() ||
      !!(f.department && f.department.length);

    if (!has) return null;

    let eq = supabase.from('employees').select('id');
    if (f.employee_name?.trim()) {
      eq = eq.ilike('full_name', `%${f.employee_name.trim()}%`);
    }
    if (f.position?.trim()) {
      eq = eq.ilike('position', `%${f.position.trim()}%`);
    }
    if (f.department_contains?.trim()) {
      eq = eq.ilike('department', `%${f.department_contains.trim()}%`);
    }
    if (f.department && f.department.length > 0) {
      eq = eq.in('department', f.department);
    }

    const { data, error } = await eq;
    if (error) throw error;
    const ids = (data ?? []).map((e) => e.id as string);
    if (ids.length === 0) return 'EMPTY';
    return ids;
  }

  private applyExplicitEmployeeIds(
    resolved: string[] | null | 'EMPTY',
    explicit?: string[],
  ): string[] | null | 'EMPTY' {
    if (!explicit?.length) return resolved;
    if (resolved === 'EMPTY') return 'EMPTY';
    if (resolved === null) return explicit;
    const next = resolved.filter((id) => explicit.includes(id));
    return next.length === 0 ? 'EMPTY' : next;
  }

  /**
   * When `search` is set, it drives text matching (reference, notes, employee name)
   * and is not combined with ref / employee_name / position / department_contains (client clears those).
   */
  async findAll(
    page = 1,
    limit = 20,
    filters: SalaryAdvanceListFilters = {},
  ): Promise<{ data: SalaryAdvanceRequest[]; count: number }> {
    const from = (page - 1) * limit;
    const f = filters;

    if (f.search?.trim()) {
      const term = f.search.trim();
      const { data: emps, error: eErr } = await supabase
        .from('employees')
        .select('id')
        .ilike('full_name', `%${term}%`);
      if (eErr) throw eErr;
      const empIds = (emps ?? []).map((e) => e.id as string);
      const orParts: string[] = [
        `reference_code.ilike.%${term}%`,
        `notes.ilike.%${term}%`,
      ];
      if (empIds.length > 0) {
        orParts.push(`employee_id.in.(${empIds.join(',')})`);
      }

      let q = supabase
        .from('salary_advance_requests')
        .select(SELECT_LIST, { count: 'exact' })
        .or(orParts.join(','))
        .order('advance_date', { ascending: false })
        .range(from, from + limit - 1);

      if (f.advance_date_from) q = q.gte('advance_date', f.advance_date_from);
      if (f.advance_date_to) q = q.lte('advance_date', f.advance_date_to);
      if (f.approval_status && f.approval_status.length > 0) {
        q = q.in('approval_status', f.approval_status);
      }
      if (f.payment_status && f.payment_status.length > 0) {
        q = q.in('payment_status', f.payment_status);
      }

      let searchEmpScope: string[] | null | 'EMPTY' = null;
      if (f.department && f.department.length > 0) {
        const { data: deptEmps, error: dErr } = await supabase
          .from('employees')
          .select('id')
          .in('department', f.department);
        if (dErr) throw dErr;
        const dIds = (deptEmps ?? []).map((e) => e.id as string);
        searchEmpScope = dIds.length === 0 ? 'EMPTY' : dIds;
      }
      searchEmpScope = this.applyExplicitEmployeeIds(searchEmpScope, f.employee_ids);
      if (searchEmpScope === 'EMPTY') {
        return { data: [], count: 0 };
      }
      if (searchEmpScope) {
        q = q.in('employee_id', searchEmpScope);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: (data ?? []) as SalaryAdvanceRequest[], count: count ?? 0 };
    }

    let empAnd = await this.resolveEmployeeIdsAnd(f);
    empAnd = this.applyExplicitEmployeeIds(empAnd, f.employee_ids);
    if (empAnd === 'EMPTY') {
      return { data: [], count: 0 };
    }

    let q = supabase
      .from('salary_advance_requests')
      .select(SELECT_LIST, { count: 'exact' })
      .order('advance_date', { ascending: false })
      .range(from, from + limit - 1);

    if (empAnd) {
      q = q.in('employee_id', empAnd);
    }

    if (f.ref?.trim()) {
      q = q.ilike('reference_code', `%${f.ref.trim()}%`);
    }
    if (f.advance_date_from) {
      q = q.gte('advance_date', f.advance_date_from);
    }
    if (f.advance_date_to) {
      q = q.lte('advance_date', f.advance_date_to);
    }
    if (f.approval_status && f.approval_status.length > 0) {
      q = q.in('approval_status', f.approval_status);
    }
    if (f.payment_status && f.payment_status.length > 0) {
      q = q.in('payment_status', f.payment_status);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: (data ?? []) as SalaryAdvanceRequest[], count: count ?? 0 };
  }

  async findById(id: string): Promise<SalaryAdvanceRequest | null> {
    const { data, error } = await supabase
      .from('salary_advance_requests')
      .select(SELECT_LIST)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SalaryAdvanceRequest;
  }

  async create(dto: CreateSalaryAdvanceRequestDto): Promise<SalaryAdvanceRequest> {
    const reference_code = await this.nextReferenceCode();
    const row = {
      reference_code,
      employee_id: dto.employee_id,
      advance_date: dto.advance_date,
      amount: dto.amount,
      approval_status: dto.approval_status ?? 'pending',
      payment_status: dto.payment_status ?? 'unpaid',
      notes: dto.notes ?? null,
    };

    const { data, error } = await supabase
      .from('salary_advance_requests')
      .insert(row)
      .select(SELECT_LIST)
      .single();

    if (error) throw error;
    return data as SalaryAdvanceRequest;
  }

  async update(id: string, dto: UpdateSalaryAdvanceRequestDto): Promise<SalaryAdvanceRequest> {
    const patch: Record<string, unknown> = {
      ...dto,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('salary_advance_requests')
      .update(patch)
      .eq('id', id)
      .select(SELECT_LIST)
      .single();

    if (error) throw error;
    return data as SalaryAdvanceRequest;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('salary_advance_requests').delete().eq('id', id);
    if (error) throw error;
  }

  async getStats(): Promise<SalaryAdvanceStats> {
    const { data, error } = await supabase
      .from('salary_advance_requests')
      .select('amount, approval_status, payment_status');

    if (error) throw error;
    const rows = data ?? [];

    const byApproval: SalaryAdvanceStats['byApproval'] = {
      pending: 0,
      approved: 0,
      reconciled: 0,
    };
    const byPayment: SalaryAdvanceStats['byPayment'] = {
      unpaid: 0,
      paid: 0,
    };
    let totalAmount = 0;

    for (const r of rows) {
      const a = Number(r.amount) || 0;
      totalAmount += a;
      const ap = r.approval_status as keyof typeof byApproval;
      const py = r.payment_status as keyof typeof byPayment;
      if (ap in byApproval) byApproval[ap] += 1;
      if (py in byPayment) byPayment[py] += 1;
    }

    return {
      total: rows.length,
      totalAmount,
      byApproval,
      byPayment,
    };
  }
}

export function parseListFiltersFromQuery(query: Record<string, unknown>): SalaryAdvanceListFilters {
  return {
    search: typeof query.search === 'string' ? query.search : undefined,
    ref: typeof query.ref === 'string' ? query.ref : undefined,
    employee_name: typeof query.employee_name === 'string' ? query.employee_name : undefined,
    position: typeof query.position === 'string' ? query.position : undefined,
    department_contains:
      typeof query.department_contains === 'string' ? query.department_contains : undefined,
    advance_date_from:
      typeof query.advance_date_from === 'string' ? query.advance_date_from : undefined,
    advance_date_to:
      typeof query.advance_date_to === 'string' ? query.advance_date_to : undefined,
    approval_status: parseCsvParam(query.approval_status),
    payment_status: parseCsvParam(query.payment_status),
    department: parseCsvParam(query.department),
    employee_ids: parseCsvParam(query.employee_id),
  };
}
