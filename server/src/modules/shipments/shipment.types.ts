export type ShipmentStatus =
  | 'draft'
  | 'feasibility_check'
  | 'approved'
  | 'cost_locked'
  | 'docs_ready'
  | 'booked'
  | 'customs_cleared'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface ShipmentCostBreakdown {
  trucking?: number;
  agent?: number;
  customs?: number;
  other?: number;
}

export interface Shipment {
  id: string;
  code?: string;
  customer_id: string;
  supplier_id: string;
  commodity?: string;
  commodity_cn?: string;
  hs_code?: string;
  quantity?: number;
  packing?: string;
  vessel_voyage?: string;
  term?: string;
  incoterm?: string;
  special_requirements?: string;
  transport_air: boolean;
  transport_sea: boolean;
  load_fcl: boolean;
  load_lcl: boolean;
  pol?: string;
  pod?: string;
  etd?: string;
  eta?: string;
  actual_eta?: string;
  delay_hours?: number;
  border_stuck?: boolean;
  mark_as_breach?: boolean;
  pic_id?: string;
  status?: ShipmentStatus;
  
  // Costs
  planned_cost?: ShipmentCostBreakdown;
  actual_cost?: ShipmentCostBreakdown;
  currency?: string;
  exchange_rate?: number;
  revenue_source?: string;
  
  // POD
  pod_file?: string;
  delivery_confirmed_at?: string;
  receiver_name?: string;

  // Booleans / Gates
  is_docs_ready?: boolean;
  is_hs_confirmed?: boolean;
  is_phytosanitary_ready?: boolean;
  is_cost_locked?: boolean;
  is_truck_booked?: boolean;
  is_agent_booked?: boolean;
  shipment_ready_to_run?: boolean;
  
  pod_confirmed_at?: string | null;
  cost_locked_at?: string | null;
  quotation_id?: string | null;
  contract_id?: string | null;
  
  // Audit
  version: number;
  is_archived?: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface CreateShipmentDto extends Partial<Omit<Shipment, 'id' | 'created_at' | 'version'>> {
  customer_id: string;
  supplier_id: string;
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {
  version?: number; // Include version for optimistic locking
}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
  version?: number; // Added for concurrency control
}

export interface ShipmentReadinessResult {
  ready: boolean;
  missing: string[];
}

export interface BlockedTransition {
  status: ShipmentStatus;
  reason: string;
}

export interface AllowedTransitionsResult {
  current_status: ShipmentStatus;
  allowed: ShipmentStatus[];
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

export type FeasibilityDepartment = 'logistics' | 'procurement' | 'finance' | 'packaging';
export type FeasibilityStatus = 'pending' | 'approved' | 'rejected';

export interface FeasibilityApproval {
  id: string;
  shipment_id: string;
  department: FeasibilityDepartment;
  status: FeasibilityStatus;
  approved_by?: string;
  approved_at?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateFeasibilityDto {
  department: FeasibilityDepartment;
  status: FeasibilityStatus;
  note?: string;
}
