import { supabase } from '../../config/supabase';
import type {
  CreateCustomerExpenseDto,
  CustomerExpense,
  CustomerExpenseListFilters,
  CustomerExpenseStats,
  CustomerExpenseStatus,
  UpdateCustomerExpenseDto,
} from './customer-expense.types';

const SELECT_LIST =
  '*, employee:employees(id, full_name, department, position), customer:customers(id, company_name), shipment:shipments(id, code, master_job_no)';

function parseCsvParam(v: unknown): string[] | undefined {
  if (v == null || v === '') return undefined;
  if (Array.isArray(v))
    return v.flatMap((s) => String(s).split(',')).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function lineTotal(amount: unknown, tax: unknown): number {
  return (Number(amount) || 0) + (Number(tax) || 0);
}

const ALL_STATUSES: CustomerExpenseStatus[] = [
  'draft',
  'submitted',
  'under_validation',
  'approved',
  'completed',
  'refused',
];

function applyExpenseListFilters<T>(q: T, f: CustomerExpenseListFilters): T {
  let query: unknown = q;
  if (f.expense_date_from) query = (query as { gte: (c: string, v: string) => unknown }).gte('expense_date', f.expense_date_from);
  if (f.expense_date_to) query = (query as { lte: (c: string, v: string) => unknown }).lte('expense_date', f.expense_date_to);
  if (f.status && f.status.length > 0) {
    query = (query as { in: (c: string, v: string[]) => unknown }).in('status', f.status);
  }
  if (f.customer_id && f.customer_id.length > 0) {
    query = (query as { in: (c: string, v: string[]) => unknown }).in('customer_id', f.customer_id);
  }
  if (f.employee_id && f.employee_id.length > 0) {
    query = (query as { in: (c: string, v: string[]) => unknown }).in('employee_id', f.employee_id);
  }
  if (f.job_id && f.job_id.length > 0) {
    query = (query as { in: (c: string, v: string[]) => unknown }).in('shipment_id', f.job_id);
  }
  return query as T;
}

export class CustomerExpenseService {

  async findAll(
    page = 1,
    limit = 20,
    filters: CustomerExpenseListFilters = {},
  ): Promise<{ data: CustomerExpense[]; count: number }> {
    const from = (page - 1) * limit;
    const f = filters;

    if (f.search?.trim()) {
      const term = f.search.trim();
      const { data: shipments, error: sErr } = await supabase
        .from('shipments')
        .select('id')
        .or(`master_job_no.ilike.%${term}%,code.ilike.%${term}%`);
      if (sErr) throw sErr;
      const shipmentIds = (shipments ?? []).map((s) => s.id as string);

      const orParts: string[] = [
        `description.ilike.%${term}%`,
        `bill_reference.ilike.%${term}%`,
      ];
      if (shipmentIds.length > 0) {
        orParts.push(`shipment_id.in.(${shipmentIds.join(',')})`);
      }

      let q = supabase
        .from('customer_expenses')
        .select(SELECT_LIST, { count: 'exact' })
        .or(orParts.join(','))
        .order('expense_date', { ascending: false })
        .range(from, from + limit - 1);

      q = applyExpenseListFilters(q, f);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: (data ?? []) as CustomerExpense[], count: count ?? 0 };
    }

    let q = supabase
      .from('customer_expenses')
      .select(SELECT_LIST, { count: 'exact' })
      .order('expense_date', { ascending: false })
      .range(from, from + limit - 1);

    q = applyExpenseListFilters(q, f);

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: (data ?? []) as CustomerExpense[], count: count ?? 0 };
  }

  async findById(id: string): Promise<CustomerExpense | null> {
    const { data, error } = await supabase
      .from('customer_expenses')
      .select(SELECT_LIST)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as CustomerExpense;
  }

  async create(dto: CreateCustomerExpenseDto): Promise<CustomerExpense> {
    const row = {
      expense_date: dto.expense_date,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency ?? 'VND',
      tax_amount: dto.tax_amount ?? 0,
      status: dto.status ?? 'draft',
      paid_by: dto.paid_by ?? 'employee_reimburse',
      employee_id: dto.employee_id,
      customer_id: dto.customer_id ?? null,
      shipment_id: dto.shipment_id ?? null,
      supplier: dto.supplier ?? null,
      category: dto.category ?? null,
      bill_reference: dto.bill_reference ?? null,
      account_label: dto.account_label ?? null,
      company_name_snapshot: dto.company_name_snapshot ?? null,
      pay_for: dto.pay_for ?? null,
      service: dto.service ?? null,
      notes: dto.notes ?? null,
      create_invoice: dto.create_invoice ?? false,
    };

    const { data, error } = await supabase
      .from('customer_expenses')
      .insert(row)
      .select(SELECT_LIST)
      .single();

    if (error) throw error;
    return data as CustomerExpense;
  }

  async update(id: string, dto: UpdateCustomerExpenseDto): Promise<CustomerExpense> {
    const patch: Record<string, unknown> = {
      ...dto,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customer_expenses')
      .update(patch)
      .eq('id', id)
      .select(SELECT_LIST)
      .single();

    if (error) throw error;
    return data as CustomerExpense;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customer_expenses').delete().eq('id', id);
    if (error) throw error;
  }

  async getStats(): Promise<CustomerExpenseStats> {
    const { data, error } = await supabase
      .from('customer_expenses')
      .select('amount, tax_amount, status, expense_date');

    if (error) throw error;
    const rows = data ?? [];

    const emptyBucket = (): { count: number; totalAmount: number } => ({ count: 0, totalAmount: 0 });
    const summary = {
      submitted: emptyBucket(),
      underValidation: emptyBucket(),
      completed: emptyBucket(),
    };

    const statusMap = new Map<CustomerExpenseStatus, { count: number; totalAmount: number }>();
    for (const s of ALL_STATUSES) {
      statusMap.set(s, { count: 0, totalAmount: 0 });
    }

    const monthMap = new Map<string, { totalAmount: number; count: number }>();
    let grandTotalAmount = 0;

    for (const r of rows) {
      const amt = lineTotal(r.amount, r.tax_amount);
      grandTotalAmount += amt;
      const st = r.status as CustomerExpenseStatus;

      const cell = statusMap.get(st);
      if (cell) {
        cell.count += 1;
        cell.totalAmount += amt;
      }

      if (st === 'submitted') {
        summary.submitted.count += 1;
        summary.submitted.totalAmount += amt;
      } else if (st === 'under_validation') {
        summary.underValidation.count += 1;
        summary.underValidation.totalAmount += amt;
      } else if (st === 'completed') {
        summary.completed.count += 1;
        summary.completed.totalAmount += amt;
      }

      const d = r.expense_date as string;
      if (d) {
        const month = d.slice(0, 7);
        const prev = monthMap.get(month) ?? { totalAmount: 0, count: 0 };
        prev.totalAmount += amt;
        prev.count += 1;
        monthMap.set(month, prev);
      }
    }

    const byStatus = ALL_STATUSES.map((status) => {
      const b = statusMap.get(status)!;
      return { status, count: b.count, totalAmount: b.totalAmount };
    });

    const byMonth = Array.from(monthMap.entries())
      .map(([month, v]) => ({ month, totalAmount: v.totalAmount, count: v.count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      summary,
      byStatus,
      byMonth,
      totalCount: rows.length,
      grandTotalAmount,
    };
  }
}

export function parseCustomerExpenseListFiltersFromQuery(
  query: Record<string, unknown>,
): CustomerExpenseListFilters {
  return {
    search: typeof query.search === 'string' ? query.search : undefined,
    expense_date_from:
      typeof query.expense_date_from === 'string' ? query.expense_date_from : undefined,
    expense_date_to:
      typeof query.expense_date_to === 'string' ? query.expense_date_to : undefined,
    status: parseCsvParam(query.status),
    customer_id: parseCsvParam(query.customer_id),
    employee_id: parseCsvParam(query.employee_id),
    job_id: parseCsvParam(query.job_id),
  };
}
