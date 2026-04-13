import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateShipmentDto,
  Shipment,
  ShipmentReadinessResult,
  ShipmentStatus,
  UpdateShipmentDto,
} from './shipment.types';

const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft: ['feasibility_checked', 'cancelled'],
  feasibility_checked: ['planned', 'cancelled'],
  planned: ['docs_ready', 'cancelled'],
  docs_ready: ['booked', 'cancelled'],
  booked: ['customs_ready', 'cancelled'],
  customs_ready: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['cost_closed'],
  cost_closed: [],
  cancelled: [],
};

export class ShipmentService {
  private assertCanTransition(current: ShipmentStatus, next: ShipmentStatus) {
    if (current === next) return;
    const allowed = STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new AppError(
        `Invalid shipment status transition: ${current} -> ${next}`,
        400,
      );
    }
  }

  private getMissingRunGates(item: Shipment): string[] {
    const missing: string[] = [];
    if (!item.is_docs_ready) missing.push('docs_ready');
    if (!item.is_hs_confirmed) missing.push('hs_confirmed');
    if (!item.is_phytosanitary_ready) missing.push('phytosanitary_ready');
    if (!item.is_cost_locked) missing.push('cost_locked');
    if (!item.is_truck_booked) missing.push('truck_booked');
    if (!item.is_agent_booked) missing.push('agent_booked');
    return missing;
  }

  private assertStatusGates(next: ShipmentStatus, current: Shipment) {
    if (next === 'in_transit') {
      const missing = this.getMissingRunGates(current);
      if (missing.length > 0) {
        throw new AppError(
          `Cannot move shipment to in_transit. Missing checklist gates: ${missing.join(', ')}`,
          400,
        );
      }
    }

    if (next === 'cost_closed') {
      if (!current.pod_confirmed_at) {
        throw new AppError('Cannot close shipment cost before POD confirmation', 400);
      }
      if (!current.is_cost_locked) {
        throw new AppError('Cannot close shipment cost before cost is locked', 400);
      }
    }
  }

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

  async getReadiness(id: string): Promise<ShipmentReadinessResult> {
    const item = await this.findById(id);
    if (!item) {
      throw new AppError('Shipment not found', 404);
    }

    const missing = this.getMissingRunGates(item);
    return {
      ready: missing.length === 0,
      missing,
    };
  }

  async generateNextCode(customer_id: string): Promise<string> {
    // 1. Get Customer Code
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('code')
      .eq('id', customer_id)
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
    return `${prefix}${sn}`;
  }

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    let finalCode = dto.code;
    
    if (!finalCode) {
      finalCode = await this.generateNextCode(dto.customer_id);
    }

    const normalizedDto: CreateShipmentDto = {
      ...dto,
      status: dto.status ?? 'draft',
    };

    // 4. Insert Shipment
    const { data, error } = await supabase
      .from('shipments')
      .insert({ ...normalizedDto, code: finalCode })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const current = await this.findById(id);
    if (!current) {
      throw new AppError('Shipment not found', 404);
    }

    const patch: UpdateShipmentDto = { ...dto };

    if (typeof dto.is_cost_locked === 'boolean' && dto.is_cost_locked && !current.is_cost_locked) {
      patch.cost_locked_at = new Date().toISOString();
    }

    if (dto.status) {
      const currentStatus = current.status ?? 'draft';
      this.assertCanTransition(currentStatus, dto.status);
      this.assertStatusGates(dto.status, { ...current, ...patch });
    }

    const { data, error } = await supabase
      .from('shipments')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: ShipmentStatus): Promise<Shipment> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
