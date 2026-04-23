import { z } from 'zod';

const nullableString = () => z.string().optional().nullable();
const nullableUuid = () => z.string().uuid().optional().nullable();

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
  shipment_id: nullableUuid(),
  customer_id: nullableUuid(),
  quote_date: nullableString(),
  status: z.enum(['draft', 'confirmed', 'sent', 'won', 'lost', 'converted', 'final']).optional(),
  priority_rank: z.number().min(0.5).max(3).optional(),
  quotation_type: z.enum(['service_breakdown', 'option_based']).optional(),
  due_date: nullableString(),
  validity_from: nullableString(),
  validity_to: nullableString(),
  sales_person_id: nullableUuid(),
  customer_trade_name: nullableString(),
  customer_contact_name: nullableString(),
  customer_contact_email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  customer_contact_tel: nullableString(),
  pickup: nullableString(),
  final_destination: nullableString(),
  cargo_volume: nullableString(),
  business_team: nullableString(),
  business_department: nullableString(),
  goods: nullableString(),
  transit_time: nullableString(),
  service_mode: nullableString(),
  direction: nullableString(),
  currency_code: z.union([z.string().min(3).max(3), z.null()]).optional(),
  job_no: nullableString(),
  sales_inquiry_no: nullableString(),
  bill_no: nullableString(),
  customs_declaration_no: nullableString(),
  incoterms: nullableString(),
  notes: nullableString(),
  exchange_rate: z.number().min(0).optional(),
  exchange_rate_date: nullableString(),
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
