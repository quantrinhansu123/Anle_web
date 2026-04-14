import { apiFetch, apiFetchPaginated } from '../lib/api';
import type {
  CustomerExpense,
  CustomerExpenseFormState,
  CustomerExpenseListQuery,
  CustomerExpenseStats,
} from '../pages/customer-expenses/types';

function buildQueryString(q: CustomerExpenseListQuery): string {
  const p = new URLSearchParams();
  if (q.page != null) p.set('page', String(q.page));
  if (q.limit != null) p.set('limit', String(q.limit));
  if (q.search?.trim()) p.set('search', q.search.trim());
  if (q.expense_date_from) p.set('expense_date_from', q.expense_date_from);
  if (q.expense_date_to) p.set('expense_date_to', q.expense_date_to);
  q.status?.forEach((s) => p.append('status', s));
  q.customer_id?.forEach((s) => p.append('customer_id', s));
  q.employee_id?.forEach((s) => p.append('employee_id', s));
  q.job_id?.forEach((s) => p.append('job_id', s));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

function bodyFromForm(dto: Omit<CustomerExpenseFormState, 'id'> | CustomerExpenseFormState) {
  return {
    expense_date: dto.expense_date,
    description: dto.description,
    amount: dto.amount,
    currency: dto.currency || 'VND',
    tax_amount: dto.tax_amount ?? 0,
    status: dto.status,
    paid_by: dto.paid_by,
    employee_id: dto.employee_id,
    customer_id: dto.customer_id ? dto.customer_id : null,
    job_id: dto.job_id ? dto.job_id : null,
    supplier: dto.supplier || null,
    category: dto.category || null,
    bill_reference: dto.bill_reference || null,
    account_label: dto.account_label || null,
    company_name_snapshot: dto.company_name_snapshot || null,
    pay_for: dto.pay_for || null,
    service: dto.service || null,
    notes: dto.notes || null,
    create_invoice: dto.create_invoice,
  };
}

export const customerExpenseService = {
  getStats: () => apiFetch<CustomerExpenseStats>(`/customer-expenses/stats`),

  getList: (query: CustomerExpenseListQuery = {}) =>
    apiFetchPaginated<CustomerExpense>(`/customer-expenses${buildQueryString(query)}`),

  getById: (id: string) => apiFetch<CustomerExpense>(`/customer-expenses/${id}`),

  create: (dto: Omit<CustomerExpenseFormState, 'id'>) =>
    apiFetch<CustomerExpense>('/customer-expenses', {
      method: 'POST',
      body: JSON.stringify(bodyFromForm(dto)),
    }),

  update: (id: string, dto: Partial<CustomerExpenseFormState>) => {
    const b: Record<string, unknown> = {};
    if (dto.expense_date !== undefined) b.expense_date = dto.expense_date;
    if (dto.description !== undefined) b.description = dto.description;
    if (dto.amount !== undefined) b.amount = dto.amount;
    if (dto.currency !== undefined) b.currency = dto.currency;
    if (dto.tax_amount !== undefined) b.tax_amount = dto.tax_amount;
    if (dto.status !== undefined) b.status = dto.status;
    if (dto.paid_by !== undefined) b.paid_by = dto.paid_by;
    if (dto.employee_id !== undefined) b.employee_id = dto.employee_id;
    if (dto.customer_id !== undefined) b.customer_id = dto.customer_id || null;
    if (dto.job_id !== undefined) b.job_id = dto.job_id || null;
    if (dto.supplier !== undefined) b.supplier = dto.supplier || null;
    if (dto.category !== undefined) b.category = dto.category || null;
    if (dto.bill_reference !== undefined) b.bill_reference = dto.bill_reference || null;
    if (dto.account_label !== undefined) b.account_label = dto.account_label || null;
    if (dto.company_name_snapshot !== undefined) b.company_name_snapshot = dto.company_name_snapshot || null;
    if (dto.pay_for !== undefined) b.pay_for = dto.pay_for || null;
    if (dto.service !== undefined) b.service = dto.service || null;
    if (dto.notes !== undefined) b.notes = dto.notes || null;
    if (dto.create_invoice !== undefined) b.create_invoice = dto.create_invoice;
    return apiFetch<CustomerExpense>(`/customer-expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(b),
    });
  },

  delete: (id: string) =>
    apiFetch<null>(`/customer-expenses/${id}`, {
      method: 'DELETE',
    }),
};
