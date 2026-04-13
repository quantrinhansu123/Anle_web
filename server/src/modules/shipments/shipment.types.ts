export type ShipmentStatus =
  | 'draft'
  | 'feasibility_checked'
  | 'planned'
  | 'docs_ready'
  | 'booked'
  | 'customs_ready'
  | 'in_transit'
  | 'delivered'
  | 'cost_closed'
  | 'cancelled';

export interface Shipment {
  id: string;
  code?: string;
  customer_id: string;
  supplier_id: string;
  commodity?: string;
  hs_code?: string;
  quantity?: number;
  packing?: string;
  vessel_voyage?: string;
  term?: string;
  transport_air: boolean;
  transport_sea: boolean;
  load_fcl: boolean;
  load_lcl: boolean;
  pol?: string;
  pod?: string;
  etd?: string; // ISO Date
  eta?: string; // ISO Date
  pic_id?: string;
  status?: ShipmentStatus;
  is_docs_ready?: boolean;
  is_hs_confirmed?: boolean;
  is_phytosanitary_ready?: boolean;
  is_cost_locked?: boolean;
  is_truck_booked?: boolean;
  is_agent_booked?: boolean;
  shipment_ready_to_run?: boolean;
  pod_confirmed_at?: string | null;
  cost_locked_at?: string | null;
  created_at: string;
}

export interface CreateShipmentDto {
  customer_id: string;
  supplier_id: string;
  code?: string;
  commodity?: string;
  hs_code?: string;
  quantity?: number;
  packing?: string;
  vessel_voyage?: string;
  term?: string;
  transport_air?: boolean;
  transport_sea?: boolean;
  load_fcl?: boolean;
  load_lcl?: boolean;
  pol?: string;
  pod?: string;
  etd?: string;
  eta?: string;
  pic_id?: string;
  status?: ShipmentStatus;
  is_docs_ready?: boolean;
  is_hs_confirmed?: boolean;
  is_phytosanitary_ready?: boolean;
  is_cost_locked?: boolean;
  is_truck_booked?: boolean;
  is_agent_booked?: boolean;
  pod_confirmed_at?: string | null;
  cost_locked_at?: string | null;
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
}

export interface ShipmentReadinessResult {
  ready: boolean;
  missing: string[];
}
