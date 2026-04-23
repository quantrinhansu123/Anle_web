import { z } from 'zod';

export const SalesItemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1),
  rate: z.number().min(0),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  currency: z.enum(['USD', 'VND']),
  exchange_rate: z.number().min(0),
  tax_percent: z.number().min(0).max(100),
});

const SalesChargeItemSchema = z.object({
  id: z.string().uuid().optional(),
  charge_group: z.enum(['freight', 'other', 'on_behalf']),
  freight_code: z.string().optional(),
  charge_name: z.string().optional(),
  charge_type: z.string().optional(),
  currency: z.string().min(3).max(3).optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  vat_percent: z.number().min(0).max(100),
  note: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
});

export const CreateSalesSchema = z.object({
  shipment_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  quote_date: z.string().optional(),
  status: z.enum(['draft', 'confirmed', 'sent', 'won', 'lost', 'converted', 'final']).optional(),
  priority_rank: z.number().min(0.5).max(3).optional(),
  quotation_type: z.enum(['service_breakdown', 'option_based']).optional(),
  due_date: z.string().optional(),
  validity_from: z.string().optional(),
  validity_to: z.string().optional(),
  sales_person_id: z.string().uuid().optional(),
  customer_trade_name: z.string().optional(),
  customer_contact_name: z.string().optional(),
  customer_contact_email: z.union([z.string().email(), z.literal('')]).optional(),
  customer_contact_tel: z.string().optional(),
  pickup: z.string().optional(),
  final_destination: z.string().optional(),
  cargo_volume: z.string().optional(),
  business_team: z.string().optional(),
  business_department: z.string().optional(),
  goods: z.string().optional(),
  transit_time: z.string().optional(),
  service_mode: z.string().optional(),
  direction: z.string().optional(),
  currency_code: z.string().min(3).max(3).optional(),
  job_no: z.string().optional(),
  sales_inquiry_no: z.string().optional(),
  bill_no: z.string().optional(),
  customs_declaration_no: z.string().optional(),
  incoterms: z.string().optional(),
  notes: z.string().optional(),
  exchange_rate: z.number().min(0).optional(),
  exchange_rate_date: z.string().optional(),
  items: z.array(SalesItemSchema).default([]),
  charge_items: z.array(SalesChargeItemSchema).default([]),
});

export const UpdateSalesSchema = CreateSalesSchema.partial();

export const SendQuotationEmailSchema = z.object({
  to_email: z.union([z.string().email(), z.literal('')]).optional(),
  subject: z.string().min(1).optional(),
  content_snapshot: z.string().optional(),
  sent_by: z.string().uuid().optional(),
});
