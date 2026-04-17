export type AgentType = 'general' | 'customs_broker' | 'freight_forwarder' | 'warehouse' | 'local_agent';

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

export interface UpdateShippingAgentDto extends Partial<CreateShippingAgentDto> {
  is_active?: boolean;
  rating?: number;
}

export type AgentBookingRole = 'primary' | 'secondary' | 'customs' | 'local';

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
  // Joined
  agent?: ShippingAgent | null;
}

export interface CreateAgentBookingDto {
  shipment_id: string;
  agent_id: string;
  role?: AgentBookingRole;
  note?: string | null;
}
