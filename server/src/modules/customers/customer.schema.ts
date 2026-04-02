import { z } from 'zod';

export const createCustomerSchema = z.object({
  company_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_code: z.string().optional(),
  code: z.string().length(3, { message: "Code must be exactly 3 characters long" }).optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();
