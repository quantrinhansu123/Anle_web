import { z } from 'zod';

const vehicleTypeEnum = z.enum([
  'truck_20ft',
  'truck_40ft',
  'container',
  'trailer',
  'van',
  'other',
]);

const transportBookingStatusEnum = z.enum([
  'pending',
  'confirmed',
  'dispatched',
  'arrived_pickup',
  'in_transit',
  'arrived_destination',
  'completed',
  'cancelled',
]);

export const createTransportBookingSchema = z.object({
  shipment_id: z.string().uuid(),
  vendor_name: z.string().min(1, 'Vendor name is required'),
  vendor_phone: z.string().optional().nullable(),
  vehicle_type: vehicleTypeEnum.optional().nullable(),
  license_plate: z.string().optional().nullable(),
  driver_name: z.string().optional().nullable(),
  driver_phone: z.string().optional().nullable(),
  pickup_location: z.string().optional().nullable(),
  pickup_time: z.string().datetime().optional().nullable(),
  delivery_location: z.string().optional().nullable(),
  delivery_time: z.string().datetime().optional().nullable(),
  planned_cost: z.number().min(0).optional().default(0),
  actual_cost: z.number().min(0).optional().nullable(),
  status: transportBookingStatusEnum.optional(),
  note: z.string().optional().nullable(),
});

export const updateTransportBookingSchema = createTransportBookingSchema.partial();

export const updateTransportBookingStatusSchema = z.object({
  status: transportBookingStatusEnum,
});
