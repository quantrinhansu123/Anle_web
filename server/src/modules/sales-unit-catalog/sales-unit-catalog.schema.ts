import { z } from 'zod';

export const createSalesUnitCatalogSchema = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(500),
  active: z.boolean().optional().default(true),
});
