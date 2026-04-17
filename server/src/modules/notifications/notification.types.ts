export type NotificationType =
  | 'delay_alert'
  | 'incident'
  | 'sla_breach'
  | 'cost_overrun'
  | 'status_change'
  | 'system';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  shipment_id: string | null;
  severity: NotificationSeverity;
  is_read: boolean;
  dedup_key?: string | null;
  created_at: string;
}

export interface CreateNotificationDto {
  user_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  shipment_id?: string | null;
  severity?: NotificationSeverity;
  dedup_key?: string | null;
}
