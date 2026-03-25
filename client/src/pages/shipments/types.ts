export interface Shipment {
  id: string;
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
  created_at: string;
  // Joined fields
  customers?: { company_name: string };
  suppliers?: { company_name: string };
}

export interface CreateShipmentDto {
  customer_id: string;
  supplier_id: string;
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
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}

export interface ShipmentFormState extends CreateShipmentDto {
  id?: string;
  isNewCustomer?: boolean;
  newCustomer?: {
    company_name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_code?: string;
  };
  isNewSupplier?: boolean;
  newSupplier?: {
    id: string;
    company_name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_code?: string;
  };
}

export interface FilterOption {
  id: string;
  label: string;
  count: number;
}
