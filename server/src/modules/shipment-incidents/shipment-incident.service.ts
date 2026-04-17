import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateShipmentIncidentDto,
  IncidentStatus,
  ShipmentIncident,
  UpdateShipmentIncidentDto,
} from './shipment-incident.types';

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ['investigating', 'resolved', 'escalated', 'closed'],
  investigating: ['resolved', 'escalated', 'closed'],
  escalated: ['investigating', 'resolved', 'closed'],
  resolved: ['closed', 'open'],
  closed: ['open'],
};

export class ShipmentIncidentService {
  private assertCanTransition(current: IncidentStatus, next: IncidentStatus) {
    if (current === next) return;
    const allowed = STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new AppError(`Invalid incident status transition: ${current} -> ${next}`, 400);
    }
  }

  async findByShipment(shipmentId: string): Promise<ShipmentIncident[]> {
    const { data, error } = await supabase
      .from('shipment_incidents')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async findById(id: string): Promise<ShipmentIncident | null> {
    const { data, error } = await supabase
      .from('shipment_incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateShipmentIncidentDto): Promise<ShipmentIncident> {
    const payload = {
      ...dto,
      severity: dto.severity ?? 'medium',
      status: 'open' as const,
      photo_urls: dto.photo_urls ?? [],
    };

    const { data, error } = await supabase
      .from('shipment_incidents')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateShipmentIncidentDto): Promise<ShipmentIncident> {
    const current = await this.findById(id);
    if (!current) throw new AppError('Incident not found', 404);

    if (dto.status && dto.status !== current.status) {
      this.assertCanTransition(current.status, dto.status);
    }

    const patch: Record<string, any> = { ...dto };
    if (dto.status === 'resolved' && !current.resolved_at) {
      patch.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('shipment_incidents')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipment_incidents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
