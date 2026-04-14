import { z } from 'zod';

const status = z.enum([
  'draft',
  'submitted',
  'under_validation',
  'approved',
  'completed',
  'refused',
]);

const paidBy = z.enum(['employee_reimburse', 'company', 'third_party']);

export const createCustomerExpenseSchema = z.object({
  expense_date: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().finite().nonnegative(),
  currency: z.string().min(1).optional(),
  tax_amount: z.number().finite().nonnegative().optional(),
  status: status.optional(),
  paid_by: paidBy.optional(),
  employee_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  supplier: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  bill_reference: z.string().nullable().optional(),
  account_label: z.string().nullable().optional(),
  company_name_snapshot: z.string().nullable().optional(),
  pay_for: z.string().nullable().optional(),
  service: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  create_invoice: z.boolean().optional(),
});

export const updateCustomerExpenseSchema = createCustomerExpenseSchema.partial();
