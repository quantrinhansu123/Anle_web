import { supabase } from '../../config/supabase';
import { calculateDelayHours, getSlaAlertLevel, getDelaySeverity } from '../../utils/sla.utils';
import { NotificationService } from '../notifications/notification.service';
import type {
  CreateTrackingEventDto,
  ShipmentTrackingEvent,
} from './shipment-tracking.types';

const notificationService = new NotificationService();

export class ShipmentTrackingService {
  async findByShipment(shipmentId: string): Promise<ShipmentTrackingEvent[]> {
    const { data, error } = await supabase
      .from('shipment_tracking_events')
      .select('*, created_by:employees!shipment_tracking_events_created_by_id_fkey(full_name)')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback without join if FK doesn't exist yet
      const { data: fallback, error: fallbackError } = await supabase
        .from('shipment_tracking_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return fallback ?? [];
    }

    return data ?? [];
  }

  async findById(id: string): Promise<ShipmentTrackingEvent | null> {
    const { data, error } = await supabase
      .from('shipment_tracking_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get SLA info for a shipment (ETA, current delay, alert level).
   */
  async getSlaInfo(shipmentId: string): Promise<{
    eta: string | null;
    delay_hours: number;
    alert_level: string;
    has_active_delay: boolean;
  }> {
    // Get shipment ETA
    const { data: shipment } = await supabase
      .from('shipments')
      .select('eta, actual_eta, code, status')
      .eq('id', shipmentId)
      .single();

    const eta = shipment?.eta ?? null;
    const actualEta = shipment?.actual_eta ?? null;
    const delayHours = calculateDelayHours(eta, actualEta);
    const alertLevel = getSlaAlertLevel(delayHours);

    // Check for active delay events
    const { data: delayEvents } = await supabase
      .from('shipment_tracking_events')
      .select('id, delay_hours')
      .eq('shipment_id', shipmentId)
      .eq('event_type', 'delay')
      .order('created_at', { ascending: false })
      .limit(1);

    const latestDelay = delayEvents?.[0]?.delay_hours ?? 0;
    const effectiveDelay = Math.max(delayHours, latestDelay);

    return {
      eta,
      delay_hours: effectiveDelay,
      alert_level: getSlaAlertLevel(effectiveDelay),
      has_active_delay: effectiveDelay > 0,
    };
  }

  async create(dto: CreateTrackingEventDto): Promise<ShipmentTrackingEvent> {
    // If delay event, auto-calculate delay_hours from shipment ETA if not provided
    let effectiveDelayHours = dto.delay_hours ?? null;

    if (dto.event_type === 'delay' && !effectiveDelayHours) {
      const { data: shipment } = await supabase
        .from('shipments')
        .select('eta, actual_eta')
        .eq('id', dto.shipment_id)
        .single();

      if (shipment?.eta) {
        effectiveDelayHours = calculateDelayHours(shipment.eta, shipment.actual_eta);
      }
    }

    const insertDto = {
      ...dto,
      delay_hours: effectiveDelayHours,
    };

    const { data, error } = await supabase
      .from('shipment_tracking_events')
      .insert(insertDto)
      .select()
      .single();

    if (error) throw error;

    // ─── Side Effects (async, non-blocking) ─────────────────────

    // Update shipment's current location if provided
    if (dto.location) {
      await supabase
        .from('shipments')
        .update({ current_location: dto.location })
        .eq('id', dto.shipment_id)
        .then(() => {}); // fire and forget
    }

    // If delay event with significant delay, trigger side effects
    if (dto.event_type === 'delay' && effectiveDelayHours && effectiveDelayHours > 0) {
      // Get shipment code for notifications
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('code')
        .eq('id', dto.shipment_id)
        .single();

      // Auto-create delay incident if delay > 2h
      if (effectiveDelayHours >= 2) {
        await this.autoCreateDelayIncident(dto.shipment_id, effectiveDelayHours, data.id);
      }

      // Dispatch notifications based on delay level
      await notificationService.notifyOnDelay(
        dto.shipment_id,
        effectiveDelayHours,
        shipmentData?.code,
      );
    }

    return data;
  }

  /**
   * Auto-create a delay incident if one doesn't already exist (open) for this shipment.
   */
  private async autoCreateDelayIncident(
    shipmentId: string,
    delayHours: number,
    trackingEventId: string,
  ): Promise<void> {
    try {
      // Check for existing open delay incident to prevent duplicates
      const { data: existing } = await supabase
        .from('shipment_incidents')
        .select('id')
        .eq('shipment_id', shipmentId)
        .eq('incident_type', 'delay')
        .in('status', ['open', 'investigating', 'escalated'])
        .limit(1);

      if (existing && existing.length > 0) return; // Already has open delay incident

      const severity = getDelaySeverity(delayHours);

      await supabase
        .from('shipment_incidents')
        .insert({
          shipment_id: shipmentId,
          incident_type: 'delay',
          severity,
          title: `Auto-detected delay: +${delayHours}h`,
          description: `Automatically created from tracking event. Delay of ${delayHours} hours detected. Tracking event ID: ${trackingEventId}`,
          status: 'open',
          photo_urls: [],
        });

      // Also notify about the incident
      await notificationService.notifyOnIncident(
        shipmentId,
        `Auto-detected delay: +${delayHours}h`,
        severity,
      );
    } catch (err) {
      console.error('Failed to auto-create delay incident:', err);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipment_tracking_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
