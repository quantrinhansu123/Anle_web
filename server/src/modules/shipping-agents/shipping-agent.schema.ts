import { z } from 'zod';

const agentTypeEnum = z.enum(['general', 'customs_broker', 'freight_forwarder', 'warehouse', 'local_agent']);
const bookingRoleEnum = z.enum(['primary', 'secondary', 'customs', 'local']);

export const createShippingAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().max(10).optional().nullable(),
  type: agentTypeEnum.optional().default('general'),
  contact_person: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  services: z.array(z.string()).optional().default([]),
  note: z.string().optional().nullable(),
});

export const updateShippingAgentSchema = createShippingAgentSchema.partial().extend({
  is_active: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const createAgentBookingSchema = z.object({
  shipment_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  role: bookingRoleEnum.optional().default('primary'),
  note: z.string().optional().nullable(),
});
