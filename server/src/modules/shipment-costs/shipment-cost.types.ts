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
