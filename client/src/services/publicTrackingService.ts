import { apiFetch } from '../lib/api';

export interface PublicTrackingEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string;
}

export interface PublicTrackingShipment {
  id: string;
  code: string | null;
  master_job_no: string | null;
  master_bl_number: string | null;
  job_date: string | null;
  services: string | null;
  bound: string | null;
  pol: string | null;
  pod: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PublicTrackingPayload {
  shipment: PublicTrackingShipment;
  events: PublicTrackingEvent[];
}

export const publicTrackingService = {
  trackByKeyword: (keyword: string) =>
    apiFetch<PublicTrackingPayload>(`/public-tracking?q=${encodeURIComponent(keyword.trim())}`),
};

