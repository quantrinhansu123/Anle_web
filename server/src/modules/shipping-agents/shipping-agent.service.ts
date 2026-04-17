import { supabase } from '../../config/supabase';
import type {
  AgentBooking,
  CreateAgentBookingDto,
  CreateShippingAgentDto,
  ShippingAgent,
  UpdateShippingAgentDto,
} from './shipping-agent.types';

export class ShippingAgentService {
  // ─── Agents CRUD ───────────────────────────────
  async findAllAgents(activeOnly = true): Promise<ShippingAgent[]> {
    let query = supabase.from('shipping_agents').select('*').order('name');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async findAgentById(id: string): Promise<ShippingAgent | null> {
    const { data, error } = await supabase.from('shipping_agents').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async createAgent(dto: CreateShippingAgentDto): Promise<ShippingAgent> {
    const payload = { ...dto, type: dto.type ?? 'general', services: dto.services ?? [] };
    const { data, error } = await supabase.from('shipping_agents').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async updateAgent(id: string, dto: UpdateShippingAgentDto): Promise<ShippingAgent> {
    const { data, error } = await supabase.from('shipping_agents').update(dto).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase.from('shipping_agents').delete().eq('id', id);
    if (error) throw error;
  }

  // ─── Agent Bookings ────────────────────────────
  private async syncShipmentAgentBooked(shipmentId: string): Promise<void> {
    const { data, error } = await supabase
      .from('agent_bookings')
      .select('confirmed')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    const isAgentBooked = rows.some((r) => r.confirmed);

    const { error: updateError } = await supabase
      .from('shipments')
      .update({ is_agent_booked: isAgentBooked })
      .eq('id', shipmentId);

    if (updateError) throw updateError;
  }

  async findBookingsByShipment(shipmentId: string): Promise<AgentBooking[]> {
    const { data, error } = await supabase
      .from('agent_bookings')
      .select('*, agent:shipping_agents(*)')
      .eq('shipment_id', shipmentId)
      .order('created_at');

    if (error) throw error;
    return data ?? [];
  }

  async createBooking(dto: CreateAgentBookingDto): Promise<AgentBooking> {
    const payload = { ...dto, role: dto.role ?? 'primary' };
    const { data, error } = await supabase.from('agent_bookings').insert(payload).select('*, agent:shipping_agents(*)').single();
    if (error) throw error;
    await this.syncShipmentAgentBooked(dto.shipment_id);
    return data;
  }

  async sendPreAlert(bookingId: string): Promise<AgentBooking> {
    const { data, error } = await supabase
      .from('agent_bookings')
      .update({ pre_alert_sent: true, pre_alert_sent_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select('*, agent:shipping_agents(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async confirmBooking(bookingId: string): Promise<AgentBooking> {
    const { data, error } = await supabase
      .from('agent_bookings')
      .update({ confirmed: true, confirmed_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select('*, agent:shipping_agents(*)')
      .single();

    if (error) throw error;
    await this.syncShipmentAgentBooked(data.shipment_id);
    return data;
  }

  async deleteBooking(id: string): Promise<void> {
    const { data: current } = await supabase.from('agent_bookings').select('shipment_id').eq('id', id).single();
    const { error } = await supabase.from('agent_bookings').delete().eq('id', id);
    if (error) throw error;
    if (current) await this.syncShipmentAgentBooked(current.shipment_id);
  }
}
