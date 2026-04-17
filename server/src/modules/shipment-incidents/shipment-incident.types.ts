export type IncidentType =
  | 'damage'
  | 'delay'
  | 'loss'
  | 'documentation'
  | 'customs'
  | 'safety'
  | 'theft'
  | 'weather'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed';

export interface ShipmentIncident {
  id: string;
  shipment_id: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description?: string | null;
  location?: string | null;
  reported_by?: string | null;
  reported_at: string;
  status: IncidentStatus;
  resolution?: string | null;
  resolved_at?: string | null;
  photo_urls: string[];
  escalation_notes?: string | null;
  created_at: string;
}

export interface CreateShipmentIncidentDto {
  shipment_id: string;
  incident_type: IncidentType;
  severity?: IncidentSeverity;
  title: string;
  description?: string | null;
  location?: string | null;
  reported_by?: string | null;
  photo_urls?: string[];
}

export interface UpdateShipmentIncidentDto {
  status?: IncidentStatus;
  resolution?: string | null;
  escalation_notes?: string | null;
  severity?: IncidentSeverity;
}
