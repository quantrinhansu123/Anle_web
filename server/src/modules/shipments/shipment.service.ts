import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import { calculateDelayHours } from '../../utils/sla.utils';
import { NotificationService } from '../notifications/notification.service';
import { ShipmentCostService } from '../shipment-costs/shipment-cost.service';
import type {
  CreateShipmentDto,
  Shipment,
  ShipmentReadinessResult,
  ShipmentStatus,
  UpdateShipmentDto,
  AllowedTransitionsResult,
  BlockedTransition,
  RunGatesResult,
  RunGateItem,
  FeasibilityApproval,
  FeasibilityDepartment,
  FeasibilityStatus,
  UpdateFeasibilityDto,
  ShipmentBlLine,
  ShipmentBlLineInput,
  ArrivalNoticeRecord,
  DeliveryNoteRecord,
} from './shipment.types';

const notificationService = new NotificationService();
const shipmentCostService = new ShipmentCostService();

const normalizeShipmentStatus = (status?: string | null): ShipmentStatus => {
  switch (status) {
    case 'feasibility_checked':
      return 'feasibility_check';
    case 'planned':
      return 'approved';
    case 'customs_ready':
      return 'customs_cleared';
    case 'cost_closed':
      return 'completed';
    case 'feasibility_check':
    case 'approved':
    case 'cost_locked':
    case 'docs_ready':
    case 'booked':
    case 'customs_cleared':
    case 'in_transit':
    case 'delivered':
    case 'completed':
    case 'cancelled':
    case 'draft':
      return status;
    default:
      return 'draft';
  }
};

const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft: ['feasibility_check', 'cancelled'],
  feasibility_check: ['draft', 'approved', 'cancelled'], // can rollback to draft
  approved: ['cost_locked', 'cancelled'],
  cost_locked: ['docs_ready', 'cancelled'],
  docs_ready: ['booked', 'cancelled'],
  booked: ['docs_ready', 'customs_cleared', 'cancelled'], // rollback allowed
  customs_cleared: ['booked', 'in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class ShipmentService {
  private assertCanTransition(current: ShipmentStatus, next: ShipmentStatus) {
    current = normalizeShipmentStatus(current);
    next = normalizeShipmentStatus(next);
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
    if (!item.contract_id) missing.push('contract_ok');
    if (!item.is_docs_ready) missing.push('docs_ready');
    if (!item.is_hs_confirmed) missing.push('hs_confirmed');
    if (!item.is_phytosanitary_ready) missing.push('phytosanitary');
    if (!item.is_cost_locked) missing.push('cost_locked');
    if (!item.is_truck_booked && !item.transport_air && !item.transport_sea) missing.push('truck_booked'); 
    if (!item.is_agent_booked) missing.push('agent_booked');
    return missing;
  }

  private async assertStatusGates(next: ShipmentStatus, current: Shipment) {
    next = normalizeShipmentStatus(next);
    if (next === 'cost_locked') {
      if (!current.planned_cost || Object.keys(current.planned_cost).length === 0) {
        throw new AppError('Cannot lock cost without planned cost data.', 400);
      }
    }
    if (next === 'in_transit') {
      const missing = this.getMissingRunGates(current);
      if (missing.length > 0) {
        throw new AppError(
          `Cannot move shipment to in_transit. Missing checklist gates: ${missing.join(', ')}`,
          400,
        );
      }
    }

    if (next === 'completed') {
      if (!current.pod_confirmed_at) {
        throw new AppError('Cannot complete shipment before POD confirmation', 400);
      }
      if (!current.is_cost_locked) {
        throw new AppError('Cannot complete shipment before planned costs are locked', 400);
      }
      // SOP requires actual cost reconciliation before completion
      const reconciled = await shipmentCostService.allCostsReconciled(current.id);
      if (!reconciled) {
        throw new AppError('Cannot complete shipment before all actual costs are reconciled', 400);
      }
    }
  }

  async findAll(page = 1, limit = 20, filters?: { q?: string }): Promise<{ data: Shipment[]; count: number }> {
    const from = (page - 1) * limit;
    let query = supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*), pic:employees!shipments_pic_id_fkey(*)', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    const rawQ = filters?.q?.trim();
    if (rawQ) {
      const escaped = rawQ.replace(/[%_]/g, '\\$&');
      query = query.or(
        `code.ilike.%${escaped}%,master_job_no.ilike.%${escaped}%,master_bl_number.ilike.%${escaped}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Shipment | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*), pic:employees!shipments_pic_id_fkey(*)')
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
      status: normalizeShipmentStatus(dto.status ?? 'draft'),
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

    // OCC Check
    if (dto.version !== undefined && current.version !== undefined && dto.version !== current.version) {
      throw new AppError('Concurrency Conflict: This shipment was modified by another user. Please refresh and try again.', 409);
    }

    const patch: UpdateShipmentDto = { ...dto };
    const bl_lines = (patch as Record<string, unknown>).bl_lines as ShipmentBlLineInput[] | undefined;
    delete (patch as Record<string, unknown>).bl_lines;

    if (typeof dto.is_cost_locked === 'boolean' && dto.is_cost_locked && !current.is_cost_locked) {
      patch.cost_locked_at = new Date().toISOString();
    }

    if (dto.status) {
      const currentStatus = normalizeShipmentStatus(current.status ?? 'draft');
      const nextStatus = normalizeShipmentStatus(dto.status);
      patch.status = nextStatus;
      this.assertCanTransition(currentStatus, nextStatus);
      await this.assertStatusGates(nextStatus, { ...current, ...patch });
    }

    patch.version = (current.version ?? 1) + 1;

    const { data, error } = await supabase
      .from('shipments')
      .update(patch)
      .eq('id', id)
      // Force safe guard at DB level if possible, but our select checking helps 
      .select()
      .single();

    if (error) throw error;

    if (bl_lines !== undefined) {
      await this.replaceBlLines(id, bl_lines);
    }

    // ─── Side Effects on Status Change ────────────────────────────
    if (dto.status && normalizeShipmentStatus(dto.status) !== normalizeShipmentStatus(current.status)) {
       const nextStatus = normalizeShipmentStatus(dto.status);
       const prevStatus = normalizeShipmentStatus(current.status);
       // Log the change
       await supabase.from('shipment_logs').insert({
         shipment_id: id,
         action: 'status_change',
         from_value: prevStatus,
         to_value: nextStatus,
         note: 'Status transitioned via API'
       });

       // Dispatch notification (non-blocking)
       notificationService.notifyOnStatusChange(
         id,
         prevStatus,
         nextStatus,
         current.code,
       ).catch(err => console.error('Failed to notify status change:', err));

       // Vendor KPI update on completion or cancellation
       if ((nextStatus === 'completed' || nextStatus === 'cancelled') && current.supplier_id) {
         // Merge dto status so updateVendorKpi knows the final status
         this.updateVendorKpi({ ...current, status: nextStatus }).catch(err =>
           console.error('Failed to update vendor KPI:', err)
         );
       }
    }

    return data;
  }

  /**
   * Update supplier KPI metrics when a shipment is completed.
   */
  private async updateVendorKpi(shipment: Shipment): Promise<void> {
    const supplierId = shipment.supplier_id;
    if (!supplierId) return;

    // Calculate on-time delivery
    const delayHours = calculateDelayHours(shipment.eta);
    const isOnTime = delayHours <= 2; // Within 2 hours tolerance = on-time

    // Calculate cost variance
    let costVariance = 0;
    if (shipment.planned_cost && shipment.actual_cost) {
      const calcTotal = (cost: any) => {
        if (typeof cost === 'number') return cost;
        if (!cost) return 0;
        return (cost.trucking || 0) + (cost.agent || 0) + (cost.customs || 0) + (cost.other || 0);
      };
      const planned = calcTotal(shipment.planned_cost);
      const actual = calcTotal(shipment.actual_cost);
      costVariance = actual - planned;
    }

    // Get current supplier KPI
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('completed_shipments, on_time_shipments, total_delay_hours, total_cost_variance')
      .eq('id', supplierId)
      .single();

    const completedShipments = (supplier?.completed_shipments ?? 0) + 1;
    const onTimeShipments = (supplier?.on_time_shipments ?? 0) + (isOnTime ? 1 : 0);
    const totalDelayHours = (supplier?.total_delay_hours ?? 0) + delayHours;
    const totalCostVariance = (supplier?.total_cost_variance ?? 0) + costVariance;

    await supabase
      .from('suppliers')
      .update({
        completed_shipments: completedShipments,
        on_time_shipments: onTimeShipments,
        total_delay_hours: totalDelayHours,
        total_cost_variance: totalCostVariance,
      })
      .eq('id', supplierId);
  }

  async updateStatus(id: string, status: ShipmentStatus | string): Promise<Shipment> {
    return this.update(id, { status: normalizeShipmentStatus(status) });
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ─── ALLOWED TRANSITIONS (FE must not hardcode) ───────────────
  async getAllowedTransitions(id: string): Promise<AllowedTransitionsResult> {
    const item = await this.findById(id);
    if (!item) throw new AppError('Shipment not found', 404);

    const currentStatus = normalizeShipmentStatus(item.status ?? 'draft');
    const candidates = STATUS_TRANSITIONS[currentStatus] ?? [];
    const allowed: ShipmentStatus[] = [];
    const blocked: BlockedTransition[] = [];

    for (const next of candidates) {
      try {
        await this.assertStatusGates(next, item);
        allowed.push(next);
      } catch (err: any) {
        blocked.push({ status: next, reason: err.message || 'Blocked' });
      }
    }

    return { current_status: currentStatus, allowed, blocked };
  }

  // ─── RUN GATES (Pre-flight checklist from BE) ─────────────────
  async getRunGates(id: string): Promise<RunGatesResult> {
    const item = await this.findById(id);
    if (!item) throw new AppError('Shipment not found', 404);

    const missing: RunGateItem[] = [];

    if (!item.contract_id) missing.push({ key: 'contract_ok', message: 'Contract not linked' });
    if (!item.is_docs_ready) missing.push({ key: 'docs_ready', message: 'Documents not ready' });
    if (!item.is_hs_confirmed) missing.push({ key: 'hs_confirmed', message: 'HS Code not confirmed' });
    if (!item.is_phytosanitary_ready) missing.push({ key: 'phytosanitary', message: 'Phytosanitary not ready' });
    if (!item.is_cost_locked) missing.push({ key: 'cost_locked', message: 'Cost not locked' });
    if (!item.is_truck_booked && !item.transport_air && !item.transport_sea) {
      missing.push({ key: 'truck_booked', message: 'Truck not booked' });
    }
    if (!item.is_agent_booked) missing.push({ key: 'agent_booked', message: 'Agent not booked' });

    return { can_run: missing.length === 0, missing };
  }

  // ─── FEASIBILITY APPROVALS ────────────────────────────────────
  async getFeasibilityApprovals(shipmentId: string): Promise<FeasibilityApproval[]> {
    const { data, error } = await supabase
      .from('shipment_feasibility_approvals')
      .select(`
        *,
        employee:employees!approved_by (
          full_name
        )
      `)
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true });

    if (error) {
      // Simple fallback without explicit fkey link
      const { data: fb, error: fbErr } = await supabase
        .from('shipment_feasibility_approvals')
        .select('*, employees(full_name)')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });
      
      if (fbErr) {
        const { data: raw } = await supabase.from('shipment_feasibility_approvals').select('*').eq('shipment_id', shipmentId);
        return raw || [];
      }
      return (fb || []).map((r: any) => ({
        ...r,
        approved_by: r.employees?.full_name || r.employees?.[0]?.full_name || r.approved_by
      }));
    }

    return (data ?? []).map((row: any) => ({
      ...row,
      approved_by: row.employee?.full_name || (Array.isArray(row.employee) ? row.employee[0]?.full_name : null) || row.approved_by
    }));
  }

  async updateFeasibilityApproval(
    shipmentId: string,
    dto: UpdateFeasibilityDto,
    userId?: string,
  ): Promise<FeasibilityApproval> {
    // Guard: only allow updates during feasibility_check status
    const shipment = await this.findById(shipmentId);
    if (!shipment) throw new AppError('Shipment not found', 404);
    const shipmentStatus = normalizeShipmentStatus(shipment.status);
    if (shipmentStatus !== 'feasibility_check' && shipmentStatus !== 'draft') {
      throw new AppError(
        `Cannot update feasibility after approval stage. Current status: ${shipment.status}`,
        400,
      );
    }

    // Upsert: UNIQUE(shipment_id, department) ensures no duplicates
    const now = new Date().toISOString();
    const upsertData: any = {
      shipment_id: shipmentId,
      department: dto.department,
      status: dto.status,
      note: dto.note || null,
      updated_at: now,
    };

    if (dto.status === 'approved' || dto.status === 'rejected') {
      upsertData.approved_by = userId || null;
      upsertData.approved_at = now;
    }

    const { data, error } = await supabase
      .from('shipment_feasibility_approvals')
      .upsert(upsertData, { onConflict: 'shipment_id,department' })
      .select(`
        *,
        employee:employees!approved_by (
          full_name
        )
      `)
      .single();

    if (error) throw error;
    
    const mapped = {
      ...data,
      approved_by: data.employee?.full_name || (Array.isArray(data.employee) ? data.employee[0]?.full_name : null) || data.approved_by
    };

    // Log the action
    await supabase.from('shipment_logs').insert({
      shipment_id: shipmentId,
      action: 'approval',
      from_value: dto.department,
      to_value: dto.status,
      performed_by: userId || null,
      note: dto.note || `Feasibility ${dto.department} → ${dto.status}`,
    });

    return mapped;
  }

  // ─── B/L LINES ────────────────────────────────────────────────
  async getBlLines(shipmentId: string): Promise<ShipmentBlLine[]> {
    const { data, error } = await supabase
      .from('shipment_bl_lines')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async replaceBlLines(shipmentId: string, lines: ShipmentBlLineInput[] | undefined): Promise<void> {
    if (lines === undefined) return;

    const { error: delErr } = await supabase.from('shipment_bl_lines').delete().eq('shipment_id', shipmentId);
    if (delErr) throw delErr;

    if (lines.length === 0) return;

    const rows = lines.map((l, i) => ({
      shipment_id: shipmentId,
      sort_order: l.sort_order ?? i,
      name_1: l.name_1 ?? null,
      sea_customer: l.sea_customer ?? null,
      air_customer: l.air_customer ?? null,
      name_2: l.name_2 ?? null,
      package_text: l.package_text ?? null,
      unit_text: l.unit_text ?? null,
      sea_etd: l.sea_etd ?? null,
      sea_eta: l.sea_eta ?? null,
      air_etd: l.air_etd ?? null,
      air_eta: l.air_eta ?? null,
      loading_date: l.loading_date ?? null,
      delivery_date: l.delivery_date ?? null,
    }));

    const { error: insErr } = await supabase.from('shipment_bl_lines').insert(rows);
    if (insErr) throw insErr;
  }

  // ─── SEA HOUSE B/L ───────────────────────────────────────────
  async getSeaHouseBl(shipmentId: string): Promise<Record<string, unknown>> {
    const shipment = await this.findById(shipmentId);
    if (!shipment) throw new AppError('Shipment not found', 404);
    const sd = (shipment.service_details ?? {}) as Record<string, unknown>;
    const blob = sd.sea_house_bl;
    if (blob && typeof blob === 'object' && !Array.isArray(blob)) {
      return blob as Record<string, unknown>;
    }
    return {};
  }

  async patchSeaHouseBl(shipmentId: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const shipment = await this.findById(shipmentId);
    if (!shipment) throw new AppError('Shipment not found', 404);

    const sd = { ...((shipment.service_details ?? {}) as Record<string, unknown>) };
    const cur =
      sd.sea_house_bl && typeof sd.sea_house_bl === 'object' && !Array.isArray(sd.sea_house_bl)
        ? ({ ...(sd.sea_house_bl as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    sd.sea_house_bl = { ...cur, ...patch };

    const { error } = await supabase
      .from('shipments')
      .update({ service_details: sd })
      .eq('id', shipmentId);

    if (error) throw error;
    return this.getSeaHouseBl(shipmentId);
  }

  async getArrivalNotice(shipmentId: string): Promise<ArrivalNoticeRecord | null> {
    const { data, error } = await supabase
      .from('arrival_notices')
      .select('*')
      .eq('shipment_id', shipmentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async upsertArrivalNotice(
    shipmentId: string,
    payload: Partial<Omit<ArrivalNoticeRecord, 'id' | 'shipment_id' | 'created_at' | 'updated_at'>>,
  ): Promise<ArrivalNoticeRecord> {
    const upsertPayload = {
      shipment_id: shipmentId,
      doc_no: payload.doc_no ?? null,
      status: payload.status ?? 'draft',
      issued_at: payload.issued_at ?? null,
      issued_by: payload.issued_by ?? null,
      snapshot: payload.snapshot ?? {},
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('arrival_notices')
      .upsert(upsertPayload, { onConflict: 'shipment_id' })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async getDeliveryNote(shipmentId: string): Promise<DeliveryNoteRecord | null> {
    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*')
      .eq('shipment_id', shipmentId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async upsertDeliveryNote(
    shipmentId: string,
    payload: Partial<Omit<DeliveryNoteRecord, 'id' | 'shipment_id' | 'created_at' | 'updated_at'>>,
  ): Promise<DeliveryNoteRecord> {
    const upsertPayload = {
      shipment_id: shipmentId,
      doc_no: payload.doc_no ?? null,
      status: payload.status ?? 'draft',
      delivery_date: payload.delivery_date ?? null,
      receiver_name: payload.receiver_name ?? null,
      receiver_contact: payload.receiver_contact ?? null,
      delivery_condition: payload.delivery_condition ?? null,
      remarks: payload.remarks ?? null,
      issued_at: payload.issued_at ?? null,
      issued_by: payload.issued_by ?? null,
      snapshot: payload.snapshot ?? {},
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('delivery_notes')
      .upsert(upsertPayload, { onConflict: 'shipment_id' })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
}
