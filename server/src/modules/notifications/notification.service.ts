import { supabase } from '../../config/supabase';
import { env } from '../../config/env';
import type {
  CreateNotificationDto,
  Notification,
  NotificationSeverity,
  NotificationType,
} from './notification.types';
import { getSlaAlertLevel, getSlaAlertMessage } from '../../utils/sla.utils';

export class NotificationService {
  async findByUser(userId?: string, limit = 50, unreadOnly = false, cursor?: string): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Show user-specific + broadcast notifications
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getUnreadCount(userId?: string): Promise<number> {
    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const payload = {
      user_id: dto.user_id ?? null,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      shipment_id: dto.shipment_id ?? null,
      severity: dto.severity ?? 'info',
      dedup_key: dto.dedup_key ?? null,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Dispatch webhook notification (fire-and-forget)
    if (env.WEBHOOK_URL) {
      this.dispatchWebhook(data).catch((err) =>
        console.error(`[Webhook Error] Failed to dispatch notification ${data.id}:`, err)
      );
    }

    return data;
  }

  private async dispatchWebhook(notification: Notification): Promise<void> {
    if (!env.WEBHOOK_URL) return;

    await fetch(env.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: notification.id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        shipment_id: notification.shipment_id,
        timestamp: notification.created_at,
      }),
    });
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  }

  async markAllAsRead(userId?: string): Promise<void> {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { error } = await query;
    if (error) throw error;
  }

  // ─── Event-driven notification dispatchers ────────────────────

  /**
   * Dispatches notifications based on delay events.
   * Called from tracking service when a delay tracking event is created.
   */
  async notifyOnDelay(
    shipmentId: string,
    delayHours: number,
    shipmentCode?: string,
  ): Promise<void> {
    const alertLevel = getSlaAlertLevel(delayHours);
    if (alertLevel === 'none') return;

    const message = getSlaAlertMessage(delayHours, shipmentCode);

    const severityMap: Record<string, NotificationSeverity> = {
      internal: 'warning',
      customer: 'critical',
      breach: 'critical',
    };

    const typeMap: Record<string, NotificationType> = {
      internal: 'delay_alert',
      customer: 'delay_alert',
      breach: 'sla_breach',
    };

    // Generate a unique deduplication key for this shipment and alert level
    const dedupKey = `SLA_DELAY_${alertLevel.toUpperCase()}_${shipmentId}`;

    // Note: We no longer manually SELECT for existing since the DB handles uniqueness natively via dedup_key.
    // However, catching the unique constraint violation allows for silent failure without crashing.

    try {
      await this.create({
        type: typeMap[alertLevel],
        title: alertLevel === 'breach' ? 'SLA Breach' : `Delay Alert (${delayHours}h)`,
        message,
        shipment_id: shipmentId,
        severity: severityMap[alertLevel],
        dedup_key: dedupKey,
        user_id: null, // broadcast
      });
    } catch (err: any) {
      if (err?.code !== '23505') { // Postgres unique_violation
        throw err;
      }
      // Silently ignore duplicate spam
    }
  }

  /**
   * Dispatches notification when an incident is created.
   */
  async notifyOnIncident(
    shipmentId: string,
    incidentTitle: string,
    severity: string,
  ): Promise<void> {
    await this.create({
      type: 'incident',
      title: `Incident Reported: ${incidentTitle}`,
      message: `A ${severity} severity incident has been reported. Immediate attention may be required.`,
      shipment_id: shipmentId,
      severity: severity === 'critical' || severity === 'high' ? 'critical' : 'warning',
      user_id: null,
    });
  }

  /**
   * Dispatches notification on shipment status change.
   */
  async notifyOnStatusChange(
    shipmentId: string,
    fromStatus: string,
    toStatus: string,
    shipmentCode?: string,
  ): Promise<void> {
    const ref = shipmentCode ? ` [${shipmentCode}]` : '';
    await this.create({
      type: 'status_change',
      title: `Status Update${ref}`,
      message: `Shipment status changed: ${fromStatus} → ${toStatus}`,
      shipment_id: shipmentId,
      severity: 'info',
      user_id: null,
    });
  }
}
