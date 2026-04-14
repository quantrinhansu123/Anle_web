import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateFmsJobDebitNoteDto,
  FmsJobDebitNote,
  FmsJobDebitNoteLine,
  UpdateFmsJobDebitNoteDto,
} from './fms-job-debit-note.types';

async function assertJobExists(jobId: string): Promise<void> {
  const { data, error } = await supabase.from('fms_jobs').select('id').eq('id', jobId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Job not found', 404);
}

async function fetchLines(debitNoteId: string): Promise<FmsJobDebitNoteLine[]> {
  const { data, error } = await supabase
    .from('fms_job_debit_note_lines')
    .select('*')
    .eq('debit_note_id', debitNoteId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FmsJobDebitNoteLine[];
}

export class FmsJobDebitNoteService {
  async listByJob(jobId: string): Promise<FmsJobDebitNote[]> {
    await assertJobExists(jobId);
    const { data, error } = await supabase
      .from('fms_job_debit_notes')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as FmsJobDebitNote[];
    return rows;
  }

  async findById(jobId: string, dnId: string): Promise<FmsJobDebitNote | null> {
    const { data, error } = await supabase
      .from('fms_job_debit_notes')
      .select('*')
      .eq('id', dnId)
      .eq('job_id', jobId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const lines = await fetchLines(dnId);
    return { ...(data as FmsJobDebitNote), lines };
  }

  async create(jobId: string, dto: CreateFmsJobDebitNoteDto): Promise<FmsJobDebitNote> {
    await assertJobExists(jobId);
    const status = dto.status ?? 'draft';
    const payload = dto.payload ?? {};

    const { data: note, error: insErr } = await supabase
      .from('fms_job_debit_notes')
      .upsert(
        {
        job_id: jobId,
        no_doc: dto.no_doc,
        status,
        payload,
        updated_at: new Date().toISOString(),
        },
        { onConflict: 'job_id,no_doc' },
      )
      .select('*')
      .single();

    if (insErr) throw insErr;
    const id = (note as FmsJobDebitNote).id;

    if (dto.lines) {
      const { error: delErr } = await supabase.from('fms_job_debit_note_lines').delete().eq('debit_note_id', id);
      if (delErr) throw delErr;
      if (dto.lines.length > 0) {
        const rows = dto.lines.map((l, i) => ({
          debit_note_id: id,
          sort_order: l.sort_order ?? i,
          service_code: l.service_code ?? null,
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
        const { error: lineErr } = await supabase.from('fms_job_debit_note_lines').insert(rows);
        if (lineErr) throw lineErr;
      }
    }

    return (await this.findById(jobId, id)) as FmsJobDebitNote;
  }

  async update(jobId: string, dnId: string, dto: UpdateFmsJobDebitNoteDto): Promise<FmsJobDebitNote> {
    const existing = await this.findById(jobId, dnId);
    if (!existing) throw new AppError('Debit Note not found', 404);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.no_doc !== undefined) patch.no_doc = dto.no_doc;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.payload !== undefined) patch.payload = dto.payload;

    if (Object.keys(patch).length > 1) {
      const { error: upErr } = await supabase.from('fms_job_debit_notes').update(patch).eq('id', dnId).eq('job_id', jobId);
      if (upErr) throw upErr;
    }

    if (dto.lines) {
      const { error: delErr } = await supabase.from('fms_job_debit_note_lines').delete().eq('debit_note_id', dnId);
      if (delErr) throw delErr;
      if (dto.lines.length > 0) {
        const rows = dto.lines.map((l, i) => ({
          debit_note_id: dnId,
          sort_order: l.sort_order ?? i,
          service_code: l.service_code ?? null,
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
        const { error: lineErr } = await supabase.from('fms_job_debit_note_lines').insert(rows);
        if (lineErr) throw lineErr;
      }
    }

    return (await this.findById(jobId, dnId)) as FmsJobDebitNote;
  }

  async delete(jobId: string, dnId: string): Promise<void> {
    const existing = await this.findById(jobId, dnId);
    if (!existing) throw new AppError('Debit Note not found', 404);
    const { error } = await supabase.from('fms_job_debit_notes').delete().eq('id', dnId).eq('job_id', jobId);
    if (error) throw error;
  }
}
