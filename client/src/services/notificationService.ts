import { apiFetch } from '../lib/api';

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
  created_at: string;
}

export const notificationService = {
  getNotifications: (limit = 50, unreadOnly = false, cursor?: string) => {
    let url = `/notifications?limit=${limit}${unreadOnly ? '&unreadOnly=true' : ''}`;
    if (cursor) url += `&cursor=${cursor}`;
    return apiFetch<Notification[]>(url);
  },

  getUnreadCount: () =>
    apiFetch<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiFetch<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllAsRead: () =>
    apiFetch<void>('/notifications/mark-all-read', {
      method: 'POST',
    }),
};
