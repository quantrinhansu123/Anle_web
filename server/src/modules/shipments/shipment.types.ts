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
  etd?: string; // ISO Date
  eta?: string; // ISO Date
  pic_id?: string;
  created_at: string;
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
  pic_id?: string;
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}
