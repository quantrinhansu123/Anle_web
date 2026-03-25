import { apiFetch } from '../lib/api';
import type { Shipment, CreateShipmentDto, UpdateShipmentDto } from '../pages/shipments/types';

export const shipmentService = {
  getShipments: (page = 1, limit = 20) => 
    apiFetch<Shipment[]>(`/shipments?page=${page}&limit=${limit}`),

  getShipmentById: (id: string) => 
    apiFetch<Shipment>(`/shipments/${id}`),

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

  deleteShipment: (id: string) => 
    apiFetch<void>(`/shipments/${id}`, {
      method: 'DELETE',
    }),
};
