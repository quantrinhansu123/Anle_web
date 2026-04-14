import { apiFetch } from '../lib/api';
import { apiFetchPaginated } from '../lib/api';
import type {
  SalaryAdvanceRequest,
  SalaryAdvanceStats,
  SalaryAdvanceListQuery,
  SalaryAdvanceFormState,
} from '../pages/salary-advances/types';

function buildQueryString(q: SalaryAdvanceListQuery): string {
  const p = new URLSearchParams();
  if (q.page != null) p.set('page', String(q.page));
  if (q.limit != null) p.set('limit', String(q.limit));
  if (q.search?.trim()) p.set('search', q.search.trim());
  if (q.ref?.trim()) p.set('ref', q.ref.trim());
  if (q.employee_name?.trim()) p.set('employee_name', q.employee_name.trim());
  if (q.position?.trim()) p.set('position', q.position.trim());
  if (q.department_contains?.trim()) {
    p.set('department_contains', q.department_contains.trim());
  }
  if (q.advance_date_from) p.set('advance_date_from', q.advance_date_from);
  if (q.advance_date_to) p.set('advance_date_to', q.advance_date_to);
  q.approval_status?.forEach((s) => p.append('approval_status', s));
  q.payment_status?.forEach((s) => p.append('payment_status', s));
  q.department?.forEach((s) => p.append('department', s));
  q.employee_ids?.forEach((s) => p.append('employee_id', s));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export const salaryAdvanceService = {
  getStats: () => apiFetch<SalaryAdvanceStats>(`/salary-advance-requests/stats`),

  getList: (query: SalaryAdvanceListQuery = {}) =>
    apiFetchPaginated<SalaryAdvanceRequest>(`/salary-advance-requests${buildQueryString(query)}`),

  getById: (id: string) => apiFetch<SalaryAdvanceRequest>(`/salary-advance-requests/${id}`),

  create: (dto: Omit<SalaryAdvanceFormState, 'id'>) =>
    apiFetch<SalaryAdvanceRequest>('/salary-advance-requests', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: dto.employee_id,
        advance_date: dto.advance_date,
        amount: dto.amount,
        approval_status: dto.approval_status,
        payment_status: dto.payment_status,
        notes: dto.notes || null,
      }),
    }),

  update: (id: string, dto: Partial<SalaryAdvanceFormState>) => {
    const body: Record<string, unknown> = {};
    if (dto.employee_id !== undefined) body.employee_id = dto.employee_id;
    if (dto.advance_date !== undefined) body.advance_date = dto.advance_date;
    if (dto.amount !== undefined) body.amount = dto.amount;
    if (dto.approval_status !== undefined) body.approval_status = dto.approval_status;
    if (dto.payment_status !== undefined) body.payment_status = dto.payment_status;
    if (dto.notes !== undefined) body.notes = dto.notes === '' ? null : dto.notes;
    return apiFetch<SalaryAdvanceRequest>(`/salary-advance-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: (id: string) =>
    apiFetch<null>(`/salary-advance-requests/${id}`, {
      method: 'DELETE',
    }),
};
