import { supabase } from '../../config/supabase';
import type {
  CreateShipmentCostDto,
  ShipmentCost,
  ShipmentCostSummary,
  UpdateShipmentCostDto,
} from './shipment-cost.types';

export class ShipmentCostService {
  /**
   * Sync the shipment's is_cost_locked flag based on whether
   * ALL cost lines have a planned_amount filled in (> 0).
   * This is the PRE-RUN gate per SOP: lock planned costs before shipment runs.
   * Actual cost reconciliation is checked separately at the completion gate.
   */
  private async syncShipmentCostLocked(shipmentId: string): Promise<void> {
    const { data, error } = await supabase
      .from('shipment_costs')
      .select('planned_amount')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    const allHavePlanned =
      rows.length > 0 && rows.every((row) => row.planned_amount != null && row.planned_amount > 0);

    const patch: { is_cost_locked: boolean; cost_locked_at?: string | null } = {
      is_cost_locked: allHavePlanned,
    };

    if (allHavePlanned) {
      patch.cost_locked_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('shipments')
      .update(patch)
      .eq('id', shipmentId);

    if (updateError) throw updateError;
  }

  /**
   * Check if all cost lines for a shipment have actual_amount filled.
   * Used by the shipment completion gate to ensure cost reconciliation.
   */
  async allCostsReconciled(shipmentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('shipment_costs')
      .select('actual_amount')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    return rows.length > 0 && rows.every((row) => row.actual_amount != null && row.actual_amount >= 0);
  }

  async findAll(
    page = 1,
    limit = 50,
    shipmentId?: string,
  ): Promise<{ data: ShipmentCost[]; count: number }> {
    const from = (page - 1) * limit;
    let query = supabase
      .from('shipment_costs')
      .select('*', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: true });

    if (shipmentId) {
      query = query.eq('shipment_id', shipmentId);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<ShipmentCost | null> {
    const { data, error } = await supabase
      .from('shipment_costs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getCostSummary(shipmentId: string): Promise<ShipmentCostSummary> {
    const { data, error } = await supabase
      .from('shipment_costs')
      .select('planned_amount, actual_amount')
      .eq('shipment_id', shipmentId);

    if (error) throw error;

    const rows = data ?? [];
    const totalPlanned = rows.reduce((sum, r) => sum + (r.planned_amount || 0), 0);
    const totalActual = rows.reduce((sum, r) => sum + (r.actual_amount || 0), 0);
    const variance = totalActual - totalPlanned;
    const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;
    const allHaveActual =
      rows.length > 0 && rows.every((r) => r.actual_amount != null && r.actual_amount >= 0);

    return {
      total_planned: totalPlanned,
      total_actual: totalActual,
      variance,
      variance_percent: Math.round(variancePercent * 100) / 100,
      cost_lines: rows.length,
      all_have_actual: allHaveActual,
    };
  }

  async create(dto: CreateShipmentCostDto): Promise<ShipmentCost> {
    const payload: CreateShipmentCostDto = {
      ...dto,
      planned_amount: dto.planned_amount ?? 0,
      planned_currency: dto.planned_currency ?? 'VND',
      actual_currency: dto.actual_currency ?? 'VND',
    };

    const { data, error } = await supabase
      .from('shipment_costs')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentCostLocked(payload.shipment_id);
    return data;
  }

  async update(id: string, dto: UpdateShipmentCostDto): Promise<ShipmentCost> {
    const { data, error } = await supabase
      .from('shipment_costs')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.syncShipmentCostLocked(data.shipment_id);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { data: current, error: currentError } = await supabase
      .from('shipment_costs')
      .select('shipment_id')
      .eq('id', id)
      .single();

    if (currentError) throw currentError;

    const { error } = await supabase
      .from('shipment_costs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await this.syncShipmentCostLocked(current.shipment_id);
  }
}
