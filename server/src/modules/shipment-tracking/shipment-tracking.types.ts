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
  // Joined
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
  created_by_id?: string | null;
}
