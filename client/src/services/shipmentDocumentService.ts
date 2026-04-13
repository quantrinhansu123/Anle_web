import { apiFetch } from '../lib/api';

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

export const shipmentDocumentService = {
  getShipmentDocuments: (page = 1, limit = 20, shipmentId?: string) =>
    apiFetch<ShipmentDocument[]>(
      `/shipment-documents?page=${page}&limit=${limit}${shipmentId ? `&shipmentId=${shipmentId}` : ''}`,
    ),

  getShipmentDocumentById: (id: string) =>
    apiFetch<ShipmentDocument>(`/shipment-documents/${id}`),

  createShipmentDocument: (dto: CreateShipmentDocumentDto) =>
    apiFetch<ShipmentDocument>('/shipment-documents', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateShipmentDocument: (id: string, dto: UpdateShipmentDocumentDto) =>
    apiFetch<ShipmentDocument>(`/shipment-documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteShipmentDocument: (id: string) =>
    apiFetch<void>(`/shipment-documents/${id}`, {
      method: 'DELETE',
    }),
};
