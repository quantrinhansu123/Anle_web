import { apiFetch } from '../lib/api';

export type AgentType = 'general' | 'customs_broker' | 'freight_forwarder' | 'warehouse' | 'local_agent';
export type AgentBookingRole = 'primary' | 'secondary' | 'customs' | 'local';

export interface ShippingAgent {
  id: string;
  name: string;
  code?: string | null;
  type: AgentType;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  services: string[];
  rating: number;
  is_active: boolean;
  note?: string | null;
  created_at: string;
}

export interface CreateShippingAgentDto {
  name: string;
  code?: string | null;
  type?: AgentType;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  services?: string[];
  note?: string | null;
}

export interface AgentBooking {
  id: string;
  shipment_id: string;
  agent_id: string;
  role: AgentBookingRole;
  pre_alert_sent: boolean;
  pre_alert_sent_at?: string | null;
  confirmed: boolean;
  confirmed_at?: string | null;
  note?: string | null;
  created_at: string;
  agent?: ShippingAgent | null;
}

export interface CreateAgentBookingDto {
  shipment_id: string;
  agent_id: string;
  role?: AgentBookingRole;
  note?: string | null;
}

export const shippingAgentService = {
  // Agents
  getAgents: (activeOnly = true) =>
    apiFetch<ShippingAgent[]>(`/shipping-agents?active=${activeOnly}`),

  createAgent: (dto: CreateShippingAgentDto) =>
    apiFetch<ShippingAgent>('/shipping-agents', { method: 'POST', body: JSON.stringify(dto) }),

  // Bookings
  getBookings: (shipmentId: string) =>
    apiFetch<AgentBooking[]>(`/shipping-agents/bookings/list?shipmentId=${shipmentId}`),

  createBooking: (dto: CreateAgentBookingDto) =>
    apiFetch<AgentBooking>('/shipping-agents/bookings', { method: 'POST', body: JSON.stringify(dto) }),

  sendPreAlert: (bookingId: string) =>
    apiFetch<AgentBooking>(`/shipping-agents/bookings/${bookingId}/pre-alert`, { method: 'PATCH' }),

  confirmBooking: (bookingId: string) =>
    apiFetch<AgentBooking>(`/shipping-agents/bookings/${bookingId}/confirm`, { method: 'PATCH' }),

  deleteBooking: (bookingId: string) =>
    apiFetch<void>(`/shipping-agents/bookings/${bookingId}`, { method: 'DELETE' }),
};
