import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateFmsJobPaymentNoteDto,
  FmsJobPaymentNote,
  FmsJobPaymentNoteLine,
  UpdateFmsJobPaymentNoteDto,
} from './fms-job-payment-note.types';

async function assertJobExists(jobId: string): Promise<void> {
  const { data, error } = await supabase.from('fms_jobs').select('id').eq('id', jobId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Job not found', 404);
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
  async listByJob(jobId: string): Promise<FmsJobPaymentNote[]> {
    await assertJobExists(jobId);
    const { data, error } = await supabase
      .from('fms_job_payment_notes')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FmsJobPaymentNote[];
  }

  async findById(jobId: string, pnId: string): Promise<FmsJobPaymentNote | null> {
    const { data, error } = await supabase
      .from('fms_job_payment_notes')
      .select('*')
      .eq('id', pnId)
      .eq('job_id', jobId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const lines = await fetchLines(pnId);
    return { ...(data as FmsJobPaymentNote), lines };
  }

  async create(jobId: string, dto: CreateFmsJobPaymentNoteDto): Promise<FmsJobPaymentNote> {
    await assertJobExists(jobId);
    const status = dto.status ?? 'draft';
    const payload = dto.payload ?? {};

    const { data: note, error: insErr } = await supabase
      .from('fms_job_payment_notes')
      .upsert({
        job_id: jobId,
        no_doc: dto.no_doc,
        status,
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'job_id,no_doc' })
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

    return (await this.findById(jobId, id)) as FmsJobPaymentNote;
  }

  async update(jobId: string, pnId: string, dto: UpdateFmsJobPaymentNoteDto): Promise<FmsJobPaymentNote> {
    const existing = await this.findById(jobId, pnId);
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
        .eq('job_id', jobId);
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

    return (await this.findById(jobId, pnId)) as FmsJobPaymentNote;
  }

  async delete(jobId: string, pnId: string): Promise<void> {
    const existing = await this.findById(jobId, pnId);
    if (!existing) throw new AppError('Payment Note not found', 404);
    const { error } = await supabase.from('fms_job_payment_notes').delete().eq('id', pnId).eq('job_id', jobId);
    if (error) throw error;
  }
}
