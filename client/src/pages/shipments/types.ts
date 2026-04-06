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
  etd?: string;
  eta?: string;
  pic_id?: string;
  created_at: string;
  // Joined fields
  customers?: { company_name: string };
  suppliers?: { company_name: string };
  pic?: { full_name: string };
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
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}

export interface ShipmentFormState extends CreateShipmentDto {
  id?: string;
  isNewCustomer?: boolean;
  newCustomer?: {
    company_name: string;
    code?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_code?: string;
  };
  isNewSupplier?: boolean;
  isEditingSupplier?: boolean;
  newSupplier?: {
    id: string;
    company_name: string;
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
