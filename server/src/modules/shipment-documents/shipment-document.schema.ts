import { z } from 'zod';

const shipmentDocumentTypeEnum = z.enum([
  'commercial_invoice',
  'packing_list',
  'sales_contract',
  'co_form_e',
  'phytosanitary',
  'bill_of_lading',
  'import_document',
]);

const shipmentDocumentStatusEnum = z.enum(['draft', 'verified', 'rejected', 'issued']);

export const createShipmentDocumentSchema = z.object({
  shipment_id: z.string().uuid(),
  doc_type: shipmentDocumentTypeEnum,
  doc_number: z.string().optional().nullable(),
  version: z.number().int().min(1).optional(),
  status: shipmentDocumentStatusEnum.optional(),
  file_url: z.string().optional().nullable(),
  issued_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  verified_at: z.string().datetime().optional().nullable(),
  verified_by_id: z.string().uuid().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const updateShipmentDocumentSchema = createShipmentDocumentSchema.partial();
