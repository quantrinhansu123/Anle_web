import { apiFetch } from '../lib/api';

export type TrackingEventType =
  | 'status_change'
  | 'location_update'
  | 'delay'
  | 'customs_hold'
  | 'departed'
  | 'arrived'
  | 'checkpoint'
  | 'note'
  | 'document'
  | 'cost_update';

export interface ShipmentTrackingEvent {
  id: string;
  shipment_id: string;
  event_type: TrackingEventType;
  title: string;
  description?: string | null;
  location?: string | null;
  eta_updated?: string | null;
  delay_hours?: number | null;
  created_by_id?: string | null;
  created_at: string;
  created_by?: { full_name: string } | null;
}

export interface CreateTrackingEventDto {
  shipment_id: string;
  event_type: TrackingEventType;
  title: string;
  description?: string | null;
  location?: string | null;
  eta_updated?: string | null;
  delay_hours?: number | null;
}

export interface SlaInfo {
  eta: string | null;
  delay_hours: number;
  alert_level: string;
  has_active_delay: boolean;
}

export const shipmentTrackingService = {
  getTrackingEvents: (shipmentId: string) =>
    apiFetch<ShipmentTrackingEvent[]>(`/shipment-tracking?shipmentId=${shipmentId}`),

  getSlaInfo: (shipmentId: string) =>
    apiFetch<SlaInfo>(`/shipment-tracking/sla-info?shipmentId=${shipmentId}`),

  createTrackingEvent: (dto: CreateTrackingEventDto) =>
    apiFetch<ShipmentTrackingEvent>('/shipment-tracking', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  deleteTrackingEvent: (id: string) =>
    apiFetch<void>(`/shipment-tracking/${id}`, {
      method: 'DELETE',
    }),
};
