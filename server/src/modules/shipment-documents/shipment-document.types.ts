export type ShipmentDocumentType =
  | 'commercial_invoice'
  | 'packing_list'
  | 'sales_contract'
  | 'co_form_e'
  | 'phytosanitary'
  | 'bill_of_lading'
  | 'import_document';

export type ShipmentDocumentStatus = 'draft' | 'verified' | 'rejected' | 'issued';

export interface ShipmentDocument {
  id: string;
  shipment_id: string;
  doc_type: ShipmentDocumentType;
  doc_number?: string | null;
  version: number;
  status: ShipmentDocumentStatus;
  file_url?: string | null;
  issued_at?: string | null;
  verified_at?: string | null;
  verified_by_id?: string | null;
  note?: string | null;
  created_at: string;
  verified_by?: { full_name: string };
}

export interface CreateShipmentDocumentDto {
  shipment_id: string;
  doc_type: ShipmentDocumentType;
  doc_number?: string | null;
  version?: number;
  status?: ShipmentDocumentStatus;
  file_url?: string | null;
  issued_at?: string | null;
  verified_at?: string | null;
  verified_by_id?: string | null;
  note?: string | null;
}

export interface UpdateShipmentDocumentDto extends Partial<CreateShipmentDocumentDto> {}
