import { supabase } from '../../config/supabase';
import type { CreateShipmentDto, Shipment, UpdateShipmentDto } from './shipment.types';

export class ShipmentService {
  async findAll(page = 1, limit = 20): Promise<{ data: Shipment[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*), pic:employees(*)', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Shipment | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*), pic:employees(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    // 1. Get Customer Code
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('code')
      .eq('id', dto.customer_id)
      .single();

    if (custError) throw new Error('Customer not found');
    const customerCode = (customer?.code || 'UNK').toUpperCase();

    // 2. Generate Date Part (DDMMYY)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const datePart = `${day}${month}${year}`;

    const prefix = `SCM${customerCode}${datePart}`;

    // 3. Find Next Sequence Number
    const { data: lastShipment, error: seqError } = await supabase
      .from('shipments')
      .select('code')
      .like('code', `${prefix}%`)
      .order('code', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (lastShipment && lastShipment.length > 0) {
      const lastCode = lastShipment[0].code;
      const lastSeq = lastCode ? parseInt(lastCode.slice(-2)) : 0;
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    const sn = String(sequence).padStart(2, '0');
    const finalCode = `${prefix}${sn}`;

    // 4. Insert Shipment
    const { data, error } = await supabase
      .from('shipments')
      .insert({ ...dto, code: finalCode })
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
