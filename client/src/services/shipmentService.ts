import { apiFetch, apiFetchPaginated } from '../lib/api';
import type {
  CreateShipmentDto,
  Shipment,
  ShipmentBlLine,
  ArrivalNoticeRecord,
  DeliveryNoteRecord,
  ShipmentReadinessResult,
  UpdateShipmentDto,
  UpdateShipmentStatusDto,
} from '../pages/shipments/types';

const toApiShipmentStatus = (status?: string | null) => {
  if (!status) return status;
  switch (status) {
    case 'feasibility_check':
      return 'feasibility_checked';
    case 'approved':
      return 'planned';
    case 'customs_cleared':
      return 'customs_ready';
    case 'completed':
      return 'cost_closed';
    default:
      return status;
  }
};

export interface BlockedTransition {
  status: string;
  reason: string;
}

export interface AllowedTransitionsResult {
  current_status: string;
  allowed: string[];
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

export interface FeasibilityApproval {
  id: string;
  shipment_id: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export const shipmentService = {
  getShipments: (page = 1, limit = 20) => 
    apiFetch<Shipment[]>(`/shipments?page=${page}&limit=${limit}`),

  getNextCode: (customerId: string) =>
    apiFetch<{ code: string }>(`/shipments/next-code?customerId=${customerId}`),

  getShipmentById: (id: string) => 
    apiFetch<Shipment>(`/shipments/${id}`),

  getShipmentReadiness: (id: string) =>
    apiFetch<ShipmentReadinessResult>(`/shipments/${id}/readiness`),

  getAllowedTransitions: (id: string) =>
    apiFetch<AllowedTransitionsResult>(`/shipments/${id}/allowed-transitions`),

  getRunGates: (id: string) =>
    apiFetch<RunGatesResult>(`/shipments/${id}/run-gates`),

  getFeasibilityApprovals: (id: string) =>
    apiFetch<FeasibilityApproval[]>(`/shipments/${id}/feasibility`),

  updateFeasibilityApproval: (id: string, dto: { department: string; status: string; note?: string }) =>
    apiFetch<FeasibilityApproval>(`/shipments/${id}/feasibility`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  createShipment: (dto: CreateShipmentDto) => 
    apiFetch<Shipment>('/shipments', {
      method: 'POST',
      body: JSON.stringify({
        ...dto,
        status: toApiShipmentStatus(dto.status),
      }),
    }),

  updateShipment: (id: string, dto: UpdateShipmentDto) => 
    apiFetch<Shipment>(`/shipments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...dto,
        status: toApiShipmentStatus(dto.status),
      }),
    }),

  updateShipmentStatus: (id: string, dto: UpdateShipmentStatusDto) =>
    apiFetch<Shipment>(`/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...dto,
        status: toApiShipmentStatus(dto.status),
      }),
    }),

  deleteShipment: (id: string) => 
    apiFetch<void>(`/shipments/${id}`, {
      method: 'DELETE',
    }),

  listShipmentsPaginated: (page = 1, limit = 50, filters?: Record<string, string>) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    }
    return apiFetchPaginated<Shipment>(`/shipments?${params.toString()}`);
  },

  findShipmentForTracking: async (trackingCode: string) => {
    const trimmed = trackingCode.trim();
    if (!trimmed) return null;
    const { items } = await apiFetchPaginated<Shipment>(
      `/shipments?page=1&limit=1&q=${encodeURIComponent(trimmed)}`,
    );
    return items[0] ?? null;
  },

  getBlLines: (shipmentId: string) =>
    apiFetch<ShipmentBlLine[]>(`/shipments/${shipmentId}/bl-lines`),

  replaceBlLines: (shipmentId: string, lines: ShipmentBlLine[]) =>
    apiFetch<ShipmentBlLine[]>(`/shipments/${shipmentId}/bl-lines`, {
      method: 'PUT',
      body: JSON.stringify(lines),
    }),

  getSeaHouseBl: (shipmentId: string) =>
    apiFetch<Record<string, unknown>>(`/shipments/${shipmentId}/sea-house-bl`),

  patchSeaHouseBl: (shipmentId: string, patch: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/shipments/${shipmentId}/sea-house-bl`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  getArrivalNotice: (shipmentId: string) =>
    apiFetch<ArrivalNoticeRecord | null>(`/shipments/${shipmentId}/arrival-notice`),

  upsertArrivalNotice: (
    shipmentId: string,
    payload: Partial<Omit<ArrivalNoticeRecord, 'id' | 'shipment_id' | 'created_at' | 'updated_at'>>,
  ) =>
    apiFetch<ArrivalNoticeRecord>(`/shipments/${shipmentId}/arrival-notice`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getDeliveryNote: (shipmentId: string) =>
    apiFetch<DeliveryNoteRecord | null>(`/shipments/${shipmentId}/delivery-note`),

  upsertDeliveryNote: (
    shipmentId: string,
    payload: Partial<Omit<DeliveryNoteRecord, 'id' | 'shipment_id' | 'created_at' | 'updated_at'>>,
  ) =>
    apiFetch<DeliveryNoteRecord>(`/shipments/${shipmentId}/delivery-note`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getDebitNotes: (shipmentId: string) =>
    apiFetch<unknown[]>(`/shipments/${shipmentId}/debit-notes`),

  createDebitNote: (shipmentId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/debit-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDebitNote: (shipmentId: string, dnId: string) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/debit-notes/${dnId}`),

  updateDebitNote: (shipmentId: string, dnId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/debit-notes/${dnId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDebitNote: (shipmentId: string, dnId: string) =>
    apiFetch<void>(`/shipments/${shipmentId}/debit-notes/${dnId}`, {
      method: 'DELETE',
    }),

  listAllInvoices: (page = 1, limit = 20, filters?: Record<string, string>) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    }
    return apiFetchPaginated<unknown>(`/shipments/invoices?${params.toString()}`);
  },

  getInvoices: (shipmentId: string) =>
    apiFetch<unknown[]>(`/shipments/${shipmentId}/invoices`),

  createInvoice: (shipmentId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvoice: (shipmentId: string, invoiceId: string) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/invoices/${invoiceId}`),

  updateInvoice: (shipmentId: string, invoiceId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteInvoice: (shipmentId: string, invoiceId: string) =>
    apiFetch<void>(`/shipments/${shipmentId}/invoices/${invoiceId}`, {
      method: 'DELETE',
    }),

  recordInvoicePayment: (shipmentId: string, invoiceId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/invoices/${invoiceId}/record-payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPaymentNotes: (shipmentId: string) =>
    apiFetch<unknown[]>(`/shipments/${shipmentId}/payment-notes`),

  createPaymentNote: (shipmentId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/payment-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPaymentNote: (shipmentId: string, pnId: string) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/payment-notes/${pnId}`),

  updatePaymentNote: (shipmentId: string, pnId: string, data: Record<string, unknown>) =>
    apiFetch<unknown>(`/shipments/${shipmentId}/payment-notes/${pnId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePaymentNote: (shipmentId: string, pnId: string) =>
    apiFetch<void>(`/shipments/${shipmentId}/payment-notes/${pnId}`, {
      method: 'DELETE',
    }),
};
