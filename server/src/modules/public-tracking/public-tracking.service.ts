import { supabase } from '../../config/supabase';

export type PublicTrackingEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  created_at: string;
};

export type PublicTrackingPayload = {
  shipment: {
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
  };
  events: PublicTrackingEvent[];
};

export class PublicTrackingService {
  async findByKeyword(keyword: string): Promise<PublicTrackingPayload | null> {
    const q = keyword.trim();
    if (!q) return null;
    const escaped = q.replace(/[%_]/g, '\\$&');

    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('id, code, master_job_no, master_bl_number, job_date, services, bound, pol, pod, status, created_at')
      .or(`code.ilike.%${escaped}%,master_job_no.ilike.%${escaped}%,master_bl_number.ilike.%${escaped}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    const shipment = shipments?.[0];
    if (!shipment) return null;

    const { data: events, error: eventsError } = await supabase
      .from('shipment_tracking_events')
      .select('id, title, description, location, created_at')
      .eq('shipment_id', shipment.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) throw eventsError;

    return {
      shipment,
      events: events ?? [],
    };
  }
}

