import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateFmsJobPaymentNoteDto,
  FmsJobPaymentNote,
  FmsJobPaymentNoteLine,
  UpdateFmsJobPaymentNoteDto,
} from './fms-job-payment-note.types';

async function assertShipmentExists(shipmentId: string): Promise<void> {
  const { data, error } = await supabase.from('shipments').select('id').eq('id', shipmentId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Shipment not found', 404);
}

async function fetchLines(paymentNoteId: string): Promise<FmsJobPaymentNoteLine[]> {
  const { data, error } = await supabase
    .from('fms_job_payment_note_lines')
    .select('*')
    .eq('payment_note_id', paymentNoteId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FmsJobPaymentNoteLine[];
}

export class FmsJobPaymentNoteService {
  async listByJob(shipmentId: string): Promise<FmsJobPaymentNote[]> {
    await assertShipmentExists(shipmentId);
    const { data, error } = await supabase
      .from('fms_job_payment_notes')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FmsJobPaymentNote[];
  }

  async findById(shipmentId: string, pnId: string): Promise<FmsJobPaymentNote | null> {
    const { data, error } = await supabase
      .from('fms_job_payment_notes')
      .select('*')
      .eq('id', pnId)
      .eq('shipment_id', shipmentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const lines = await fetchLines(pnId);
    return { ...(data as FmsJobPaymentNote), lines };
  }

  async create(shipmentId: string, dto: CreateFmsJobPaymentNoteDto): Promise<FmsJobPaymentNote> {
    await assertShipmentExists(shipmentId);
    const status = dto.status ?? 'draft';
    const payload = dto.payload ?? {};

    const { data: note, error: insErr } = await supabase
      .from('fms_job_payment_notes')
      .upsert({
        shipment_id: shipmentId,
        no_doc: dto.no_doc,
        status,
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'shipment_id,no_doc' })
      .select('*')
      .single();

    if (insErr) throw insErr;
    const id = (note as FmsJobPaymentNote).id;

    if (dto.lines) {
      const { error: delErr } = await supabase.from('fms_job_payment_note_lines').delete().eq('payment_note_id', id);
      if (delErr) throw delErr;
      if (dto.lines.length > 0) {
        const rows = dto.lines.map((l, i) => ({
          payment_note_id: id,
          sort_order: l.sort_order ?? i,
          vendor: l.vendor ?? null,
          service: l.service ?? null,
          fare: l.fare ?? null,
          fare_type: l.fare_type ?? null,
          fare_name: l.fare_name ?? null,
          tax: l.tax ?? null,
          currency: l.currency ?? 'VND',
          exchange_rate: l.exchange_rate ?? 1,
          unit: l.unit ?? null,
          qty: l.qty ?? 1,
          rate: l.rate ?? 0,
        }));
        const { error: lineErr } = await supabase.from('fms_job_payment_note_lines').insert(rows);
        if (lineErr) throw lineErr;
      }
    }

    return (await this.findById(shipmentId, id)) as FmsJobPaymentNote;
  }

  async update(shipmentId: string, pnId: string, dto: UpdateFmsJobPaymentNoteDto): Promise<FmsJobPaymentNote> {
    const existing = await this.findById(shipmentId, pnId);
    if (!existing) throw new AppError('Payment Note not found', 404);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.no_doc !== undefined) patch.no_doc = dto.no_doc;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.payload !== undefined) patch.payload = dto.payload;

    if (Object.keys(patch).length > 1) {
      const { error: upErr } = await supabase
        .from('fms_job_payment_notes')
        .update(patch)
        .eq('id', pnId)
        .eq('shipment_id', shipmentId);
      if (upErr) throw upErr;
    }

    if (dto.lines) {
      const { error: delErr } = await supabase.from('fms_job_payment_note_lines').delete().eq('payment_note_id', pnId);
      if (delErr) throw delErr;
      if (dto.lines.length > 0) {
        const rows = dto.lines.map((l, i) => ({
          payment_note_id: pnId,
          sort_order: l.sort_order ?? i,
          vendor: l.vendor ?? null,
          service: l.service ?? null,
          fare: l.fare ?? null,
          fare_type: l.fare_type ?? null,
          fare_name: l.fare_name ?? null,
          tax: l.tax ?? null,
          currency: l.currency ?? 'VND',
          exchange_rate: l.exchange_rate ?? 1,
          unit: l.unit ?? null,
          qty: l.qty ?? 1,
          rate: l.rate ?? 0,
        }));
        const { error: lineErr } = await supabase.from('fms_job_payment_note_lines').insert(rows);
        if (lineErr) throw lineErr;
      }
    }

    return (await this.findById(shipmentId, pnId)) as FmsJobPaymentNote;
  }

  async delete(shipmentId: string, pnId: string): Promise<void> {
    const existing = await this.findById(shipmentId, pnId);
    if (!existing) throw new AppError('Payment Note not found', 404);
    const { error } = await supabase.from('fms_job_payment_notes').delete().eq('id', pnId).eq('shipment_id', shipmentId);
    if (error) throw error;
  }
}
