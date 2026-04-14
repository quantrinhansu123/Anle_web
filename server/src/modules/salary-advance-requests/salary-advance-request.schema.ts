import { z } from 'zod';

const approvalStatus = z.enum(['pending', 'approved', 'reconciled']);
const paymentStatus = z.enum(['unpaid', 'paid']);

export const createSalaryAdvanceRequestSchema = z.object({
  employee_id: z.string().uuid(),
  advance_date: z.string().min(1),
  amount: z.number().finite().positive(),
  approval_status: approvalStatus.optional(),
  payment_status: paymentStatus.optional(),
  notes: z.string().nullable().optional(),
});

export const updateSalaryAdvanceRequestSchema = createSalaryAdvanceRequestSchema.partial();
