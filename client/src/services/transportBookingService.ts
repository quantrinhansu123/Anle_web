import { apiFetch } from '../lib/api';

export type TransportBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'arrived_pickup'
  | 'in_transit'
  | 'arrived_destination'
  | 'completed'
  | 'cancelled';

export type VehicleType =
  | 'truck_20ft'
  | 'truck_40ft'
  | 'container'
  | 'trailer'
  | 'van'
  | 'other';

export interface TransportBooking {
  id: string;
  shipment_id: string;
  vendor_name: string;
  vendor_phone?: string | null;
  vehicle_type?: VehicleType | null;
  license_plate?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  pickup_location?: string | null;
  pickup_time?: string | null;
  delivery_location?: string | null;
  delivery_time?: string | null;
  planned_cost: number;
  actual_cost?: number | null;
  status: TransportBookingStatus;
  note?: string | null;
  created_at: string;
}

export interface CreateTransportBookingDto {
  shipment_id: string;
  vendor_name: string;
  vendor_phone?: string | null;
  vehicle_type?: VehicleType | null;
  license_plate?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  pickup_location?: string | null;
  pickup_time?: string | null;
  delivery_location?: string | null;
  delivery_time?: string | null;
  planned_cost?: number;
  actual_cost?: number | null;
  status?: TransportBookingStatus;
  note?: string | null;
}

export interface UpdateTransportBookingDto extends Partial<CreateTransportBookingDto> {}

export const transportBookingService = {
  getTransportBookings: (shipmentId: string, page = 1, limit = 50) =>
    apiFetch<TransportBooking[]>(
      `/transport-bookings?page=${page}&limit=${limit}&shipmentId=${shipmentId}`,
    ),

  getTransportBookingById: (id: string) =>
    apiFetch<TransportBooking>(`/transport-bookings/${id}`),

  createTransportBooking: (dto: CreateTransportBookingDto) =>
    apiFetch<TransportBooking>('/transport-bookings', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateTransportBooking: (id: string, dto: UpdateTransportBookingDto) =>
    apiFetch<TransportBooking>(`/transport-bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  updateTransportBookingStatus: (id: string, status: TransportBookingStatus) =>
    apiFetch<TransportBooking>(`/transport-bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteTransportBooking: (id: string) =>
    apiFetch<void>(`/transport-bookings/${id}`, {
      method: 'DELETE',
    }),
};
