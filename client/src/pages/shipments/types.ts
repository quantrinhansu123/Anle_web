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

export type JobBound = 'import' | 'export' | 'domestic' | 'transit';

export type FmsJobServiceDetails = Record<string, Record<string, unknown>>;

export interface Shipment {
  id: string;
  code?: string;
  customer_id: string;
  supplier_id: string;
  commodity?: string;
  hs_code?: string;
  quantity?: number;
  quantity_unit?: string | null;
  packing?: string;
  packing_unit?: string | null;
  vessel_voyage?: string;
  term?: string;
  transport_air: boolean;
  transport_sea: boolean;
  load_fcl: boolean;
  load_lcl: boolean;
  pol?: string;
  pod?: string;
  customs_declaration_no?: string;
  bill_no?: string;
  note?: string;
  etd?: string;
  eta?: string;
  actual_eta?: string;
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
  quotation_id?: string | null;
  contract_id?: string | null;
  planned_cost?: any;
  actual_cost?: any;
  created_at: string;
  updated_at?: string;
  // Job-merged fields
  master_job_no?: string | null;
  job_date?: string | null;
  services?: string | null;
  bound?: JobBound | null;
  salesperson_id?: string | null;
  sales_team?: string | null;
  sales_department?: string | null;
  product_pic_id?: string | null;
  operators?: string | null;
  bl_status?: string | null;
  bl_status_detail?: string | null;
  master_bl_number?: string | null;
  master_bl_carrier?: string | null;
  master_bl_remarks?: string | null;
  priority_rank?: number | null;
  service_details?: FmsJobServiceDetails | null;
  customer_com?: string | null;
  liner_com?: string | null;
  performance_date?: string | null;
  // Joined fields (customers(*) từ API)
  customers?: {
    company_name: string;
    local_name?: string;
    english_name?: string;
    email?: string;
    phone?: string;
    sales_staff?: string;
  };
  suppliers?: { company_name: string };
  pic?: { full_name: string };
  quotation?: {
    id: string;
    no_doc?: string;
    quote_date?: string;
    created_at?: string;
    sales_person_id?: string;
    sales_person?: { id: string; full_name: string; team?: string; department?: string; email?: string } | null;
  } | null;
  product_pic?: { id: string; full_name: string } | null;
  salesperson?: { id: string; full_name: string } | null;
}

export interface ShipmentBlLine {
  id?: string;
  shipment_id?: string;
  sort_order: number;
  name_1: string | null;
  sea_customer: string | null;
  air_customer: string | null;
  name_2: string | null;
  package_text: string | null;
  unit_text: string | null;
  sea_etd: string | null;
  sea_eta: string | null;
  air_etd: string | null;
  air_eta: string | null;
  loading_date: string | null;
  delivery_date: string | null;
}

export interface ArrivalNoticeRecord {
  id: string;
  shipment_id: string;
  doc_no?: string | null;
  status: 'draft' | 'issued';
  issued_at?: string | null;
  issued_by?: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DeliveryNoteRecord {
  id: string;
  shipment_id: string;
  doc_no?: string | null;
  status: 'draft' | 'issued';
  delivery_date?: string | null;
  receiver_name?: string | null;
  receiver_contact?: string | null;
  delivery_condition?: string | null;
  remarks?: string | null;
  issued_at?: string | null;
  issued_by?: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentDto {
  customer_id: string;
  supplier_id?: string | null;
  code?: string;
  commodity?: string;
  hs_code?: string;
  quantity?: number;
  quantity_unit?: string | null;
  packing?: string;
  packing_unit?: string | null;
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
  quotation_id?: string | null;
  contract_id?: string | null;
  // Job-merged fields
  master_job_no?: string | null;
  job_date?: string | null;
  services?: string | null;
  bound?: JobBound | null;
  salesperson_id?: string | null;
  sales_team?: string | null;
  sales_department?: string | null;
  product_pic_id?: string | null;
  operators?: string | null;
  bl_status?: string | null;
  bl_status_detail?: string | null;
  master_bl_number?: string | null;
  master_bl_carrier?: string | null;
  master_bl_remarks?: string | null;
  priority_rank?: number | null;
  service_details?: FmsJobServiceDetails | null;
  customer_com?: string | null;
  liner_com?: string | null;
  performance_date?: string | null;
  bl_lines?: ShipmentBlLine[];
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
}

export interface ShipmentReadinessResult {
  ready: boolean;
  missing: string[];
}

export interface ShipmentFormState extends CreateShipmentDto {
  id?: string;
  isNewCustomer?: boolean;
  newCustomer?: {
    company_name?: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_code?: string;
  };
  isNewSupplier?: boolean;
  isEditingSupplier?: boolean;
  newSupplier?: {
    id?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_code?: string;
  };
  isEditingCustomer?: boolean;
  pic?: { full_name: string };
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
}

// --- Sea Details Types ---
export interface JobSeaTabFields {
  freight_term: string;
  load_type: string;
  service_terms: string;
  incoterm: string;
  shipper: string;
  consignee: string;
  delivery_agent: string;
  vendor: string;
  co_loader: string;
  sea_internal_remark: string;
  sea_carrier: string;
  first_vessel: string;
  mvvd: string;
  por: string;
  pol: string;
  ts: string;
  pod: string;
  pvt: string;
  warehouse: string;
  liner_booking_no: string;
  voy_1: string;
  voy_2: string;
  etd: string;
  eta: string;
  si_close_at: string;
  cargo_close_at: string;
  atd: string;
  ata: string;
}

export interface SeaBookingRow {
  booking: string;
  type: string;
  shipper: string;
  consignee: string;
  package: string;
  num: string;
  gross: string;
  measure: string;
}

export interface SeaAttachmentRow {
  label: string;
  file_name: string;
  file_url: string;
}

export interface SeaContainerVolumeRow {
  type: string;
  size: string;
  total_quantity: string;
}

export interface SeaCargoRow {
  type_of_commodities: string;
  commodity: string;
  size: string;
  type: string;
  quantity: string;
  soc: string;
  package_qty: string;
  package_type: string;
  total: string;
}

export interface SeaTabTablesState {
  booking_confirmations: SeaBookingRow[];
  sea_attachments: SeaAttachmentRow[];
  container_volumes: SeaContainerVolumeRow[];
  cargo_information: SeaCargoRow[];
}

// --- Trucking Details Types ---
export interface TruckingTruckRow {
  house_bl: string;
  pol: string;
  pod: string;
  plate_number: string;
  customs_declaration: string;
  salesman: string;
  load_type: string;
  service_terms: string;
  bound: string;
  incoterm: string;
  transport_mode: string;
  area: string;
  partner: string;
}

export interface TruckingQuotationRow {
  quotation: string;
  customer: string;
  status: string;
}

export interface TruckingBillingLineRow {
  customer: string;
  service: string;
  truck: string;
  fare: string;
  fare_name: string;
  tax: string;
  fare_type: string;
  currency: string;
  exchange_rate: string;
  unit: string;
  qty: string;
  rate: string;
}

export interface TruckingTabState {
  trucks: TruckingTruckRow[];
  quotations: TruckingQuotationRow[];
  billing_lines: TruckingBillingLineRow[];
  exchange_date: string;
  exchange_rate: string;
}

