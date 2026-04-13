import { z } from 'zod';

const customsLaneTypeEnum = z.enum(['green', 'yellow', 'red']);
const phytosanitaryStatusEnum = z.enum(['pending', 'in_progress', 'passed', 'failed']);
const customsStatusEnum = z.enum([
  'draft',
  'submitted',
  'inspecting',
  'released',
  'on_hold',
  'rejected',
]);

export const createCustomsClearanceSchema = z.object({
  shipment_id: z.string().uuid(),
  hs_code: z.string().min(1),
  hs_confirmed: z.boolean().optional(),
  declaration_no: z.string().optional().nullable(),
  lane_type: customsLaneTypeEnum.optional().nullable(),
  phytosanitary_status: phytosanitaryStatusEnum.optional(),
  status: customsStatusEnum.optional(),
  hold_reason: z.string().optional().nullable(),
  released_at: z.string().datetime().optional().nullable(),
  escalated_to_manager: z.boolean().optional(),
});

export const updateCustomsClearanceSchema = createCustomsClearanceSchema.partial();
