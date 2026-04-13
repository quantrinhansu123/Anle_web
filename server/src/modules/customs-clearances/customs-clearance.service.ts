import { supabase } from '../../config/supabase';
import type {
  CreateCustomsClearanceDto,
  CustomsClearance,
  UpdateCustomsClearanceDto,
} from './customs-clearance.types';

export class CustomsClearanceService {
  private async syncShipmentCustomsGates(shipmentId: string): Promise<void> {
    const { data, error } = await supabase
      .from('customs_clearances')
      .select('hs_confirmed, phytosanitary_status, status')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    const isHsConfirmed = rows.some((row) => row.hs_confirmed === true);
    const isPhytosanitaryReady = rows.some((row) => row.phytosanitary_status === 'passed');

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('status')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    const patch: {
      is_hs_confirmed: boolean;
      is_phytosanitary_ready: boolean;
      status?: string;
    } = {
      is_hs_confirmed: isHsConfirmed,
      is_phytosanitary_ready: isPhytosanitaryReady,
    };

    // Auto-progress to customs_ready when booking is completed and customs gates pass.
    if (isHsConfirmed && isPhytosanitaryReady && shipment?.status === 'booked') {
      patch.status = 'customs_ready';
    }

    const { error: updateError } = await supabase
      .from('shipments')
      .update(patch)
      .eq('id', shipmentId);

    if (updateError) throw updateError;
  }

  async findAll(
    page = 1,
    limit = 20,
    shipmentId?: string,
  ): Promise<{ data: CustomsClearance[]; count: number }> {
    const from = (page - 1) * limit;
    let query = supabase
      .from('customs_clearances')
      .select('*', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (shipmentId) {
      query = query.eq('shipment_id', shipmentId);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<CustomsClearance | null> {
    const { data, error } = await supabase
      .from('customs_clearances')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateCustomsClearanceDto): Promise<CustomsClearance> {
    const payload: CreateCustomsClearanceDto = {
      ...dto,
      hs_confirmed: dto.hs_confirmed ?? false,
      phytosanitary_status: dto.phytosanitary_status ?? 'pending',
      status: dto.status ?? 'draft',
      escalated_to_manager: dto.escalated_to_manager ?? false,
    };

    const { data, error } = await supabase
      .from('customs_clearances')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentCustomsGates(payload.shipment_id);
    return data;
  }

  async update(id: string, dto: UpdateCustomsClearanceDto): Promise<CustomsClearance> {
    const { data, error } = await supabase
      .from('customs_clearances')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentCustomsGates(data.shipment_id);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { data: current, error: currentError } = await supabase
      .from('customs_clearances')
      .select('shipment_id')
      .eq('id', id)
      .single();

    if (currentError) throw currentError;

    const { error } = await supabase
      .from('customs_clearances')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.syncShipmentCustomsGates(current.shipment_id);
  }
}
