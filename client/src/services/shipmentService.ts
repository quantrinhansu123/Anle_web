import { apiFetch } from '../lib/api';
import type {
  CreateShipmentDto,
  Shipment,
  ShipmentReadinessResult,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
} from '../pages/shipments/types';

export const shipmentService = {
  getShipments: (page = 1, limit = 20) => 
    apiFetch<Shipment[]>(`/shipments?page=${page}&limit=${limit}`),

  getNextCode: (customerId: string) =>
    apiFetch<{ code: string }>(`/shipments/next-code?customerId=${customerId}`),

  getShipmentById: (id: string) => 
    apiFetch<Shipment>(`/shipments/${id}`),

  getShipmentReadiness: (id: string) =>
    apiFetch<ShipmentReadinessResult>(`/shipments/${id}/readiness`),

  createShipment: (dto: CreateShipmentDto) => 
    apiFetch<Shipment>('/shipments', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateShipment: (id: string, dto: UpdateShipmentDto) => 
    apiFetch<Shipment>(`/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  updateShipmentStatus: (id: string, dto: UpdateShipmentStatusDto) =>
    apiFetch<Shipment>(`/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteShipment: (id: string) => 
    apiFetch<void>(`/shipments/${id}`, {
      method: 'DELETE',
    }),
};
