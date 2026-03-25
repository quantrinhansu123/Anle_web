import { supabase } from '@/config/supabase';
import type { CreateShipmentDto, Shipment, UpdateShipmentDto } from './shipment.types';

export class ShipmentService {
  async findAll(page = 1, limit = 20): Promise<{ data: Shipment[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('shipments')
      .select('*, customers(company_name), suppliers(company_name)', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Shipment | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
