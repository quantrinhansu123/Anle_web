import { apiFetch } from '../lib/api';

export type ShipmentCostType =
  | 'truck'
  | 'agent'
  | 'customs'
  | 'warehouse'
  | 'phytosanitary'
  | 'insurance'
  | 'handling'
  | 'other';

export interface ShipmentCost {
  id: string;
  shipment_id: string;
  cost_type: ShipmentCostType;
  description?: string | null;
  vendor_name?: string | null;
  planned_amount: number;
  planned_currency: string;
  actual_amount?: number | null;
  actual_currency: string;
  locked_at?: string | null;
  note?: string | null;
  created_at: string;
}

export interface CreateShipmentCostDto {
  shipment_id: string;
  cost_type: ShipmentCostType;
  description?: string | null;
  vendor_name?: string | null;
  planned_amount?: number;
  planned_currency?: string;
  actual_amount?: number | null;
  actual_currency?: string;
  note?: string | null;
}

export interface UpdateShipmentCostDto extends Partial<CreateShipmentCostDto> {}

export interface ShipmentCostSummary {
  total_planned: number;
  total_actual: number;
  variance: number;
  variance_percent: number;
  cost_lines: number;
  all_have_actual: boolean;
}

export const shipmentCostService = {
  getShipmentCosts: (shipmentId: string, page = 1, limit = 50) =>
    apiFetch<ShipmentCost[]>(
      `/shipment-costs?page=${page}&limit=${limit}&shipmentId=${shipmentId}`,
    ),

  getCostSummary: (shipmentId: string) =>
    apiFetch<ShipmentCostSummary>(`/shipment-costs/summary/${shipmentId}`),

  getShipmentCostById: (id: string) =>
    apiFetch<ShipmentCost>(`/shipment-costs/${id}`),

  createShipmentCost: (dto: CreateShipmentCostDto) =>
    apiFetch<ShipmentCost>('/shipment-costs', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateShipmentCost: (id: string, dto: UpdateShipmentCostDto) =>
    apiFetch<ShipmentCost>(`/shipment-costs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteShipmentCost: (id: string) =>
    apiFetch<void>(`/shipment-costs/${id}`, {
      method: 'DELETE',
    }),
};
