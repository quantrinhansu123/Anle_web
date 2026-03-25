import { z } from 'zod';

export const createSupplierSchema = z.object({
  id: z.string().length(3).transform(val => val.toUpperCase()),
  company_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_code: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.omit({ id: true }).partial();
