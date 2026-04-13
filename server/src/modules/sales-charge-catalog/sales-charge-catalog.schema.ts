import { z } from 'zod';

export const createSalesChargeCatalogSchema = z.object({
  freight_code: z.string().trim().min(1).max(128),
  charge_name: z.string().trim().min(1).max(500),
  charge_type: z.string().trim().min(1).max(128),
});

export const updateSalesChargeCatalogSchema = z.object({
  freight_code: z.string().trim().min(1).max(128).optional(),
  charge_name: z.string().trim().min(1).max(500).optional(),
  charge_type: z.string().trim().min(1).max(128).optional(),
  default_price: z.number().min(0).optional(),
});
