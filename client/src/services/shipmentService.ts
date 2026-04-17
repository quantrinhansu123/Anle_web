import { apiFetch } from '../lib/api';
import type {
  CreateShipmentDto,
  Shipment,
  ShipmentReadinessResult,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
} from '../pages/shipments/types';

export interface BlockedTransition {
  status: string;
  reason: string;
}

export interface AllowedTransitionsResult {
  current_status: string;
  allowed: string[];
  blocked: BlockedTransition[];
}

export interface RunGateItem {
  key: string;
  message: string;
}

export interface RunGatesResult {
  can_run: boolean;
  missing: RunGateItem[];
}

export interface FeasibilityApproval {
  id: string;
  shipment_id: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export const shipmentService = {
  getShipments: (page = 1, limit = 20) => 
    apiFetch<Shipment[]>(`/shipments?page=${page}&limit=${limit}`),

  getNextCode: (customerId: string) =>
    apiFetch<{ code: string }>(`/shipments/next-code?customerId=${customerId}`),

  getShipmentById: (id: string) => 
    apiFetch<Shipment>(`/shipments/${id}`),

  getShipmentReadiness: (id: string) =>
    apiFetch<ShipmentReadinessResult>(`/shipments/${id}/readiness`),

  getAllowedTransitions: (id: string) =>
    apiFetch<AllowedTransitionsResult>(`/shipments/${id}/allowed-transitions`),

  getRunGates: (id: string) =>
    apiFetch<RunGatesResult>(`/shipments/${id}/run-gates`),

  getFeasibilityApprovals: (id: string) =>
    apiFetch<FeasibilityApproval[]>(`/shipments/${id}/feasibility`),

  updateFeasibilityApproval: (id: string, dto: { department: string; status: string; note?: string }) =>
    apiFetch<FeasibilityApproval>(`/shipments/${id}/feasibility`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

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
