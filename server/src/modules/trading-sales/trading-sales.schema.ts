import { z } from 'zod';

export const CreateTradingSaleSchema = z.object({
  trade_date: z.string().optional().nullable(),
  shipment_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  customer_company_name: z.string().optional().nullable(),
  customer_tax_code: z.string().optional().nullable(),
  customer_address: z.string().optional().nullable(),
  commodity_code: z.string().optional().nullable(),
  commodity_name: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  price_usd: z.number().min(0).optional().nullable(),
  quantity: z.number().min(0).optional().nullable(),
  amount_usd: z.number().min(0).optional().nullable(),
  payment_percent: z.number().min(0).max(100).optional().nullable(),
  exchange_rate: z.number().min(0).optional().nullable(),
  total_vnd: z.number().min(0).optional().nullable(),
  note: z.string().optional().nullable(),
});

export const UpdateTradingSaleSchema = CreateTradingSaleSchema.partial();

