/**
 * Jobs API reads/writes `fms_jobs` + `fms_job_bl_lines` only.
 * If you see PGRST200 about shipments ↔ operation_jobs, the server is running an old build or
 * the DB no longer has `operation_jobs` after migration 20260420 — restart `npm run dev`.
 */
import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateFmsJobDto,
  FmsJob,
  FmsJobBlLineInput,
  UpdateFmsJobDto,
} from './job.types';

function normalizeWorkflowRow(job: FmsJob): FmsJob {
  const raw = String(job.workflow_status ?? '').trim();
  let workflow_status: FmsJob['workflow_status'] = 'draft';
  if (raw === 'draft' || raw === 'closed' || raw === 'cancelled') workflow_status = raw;
  else if (raw === 'email_sent' || raw === 'converted') workflow_status = 'closed';
  return { ...job, workflow_status };
}

const JOB_EMBEDS = `
  *,
  customers (*),
  quotation:sales!fms_jobs_quotation_id_fkey (
    id,
    no_doc,
    quote_date,
    created_at,
    sales_person_id,
    sales_person:employees!sales_sales_person_id_fkey ( id, full_name, team, department, email )
  ),
  product_pic:employees!fms_jobs_product_pic_id_fkey ( id, full_name ),
  salesperson:employees!fms_jobs_salesperson_id_fkey ( id, full_name ),
  created_by:employees!fms_jobs_created_by_id_fkey ( id, full_name )
`;


export class JobService {
  private async nextMasterJobNo(): Promise<string> {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const prefix = `MJ${pad(now.getDate())}${pad(now.getMonth() + 1)}${String(now.getFullYear()).slice(-2)}`;

    const { data, error } = await supabase
      .from('fms_jobs')
      .select('master_job_no')
      .like('master_job_no', `${prefix}%`)
      .order('master_job_no', { ascending: false })
      .limit(1);

    if (error) throw error;

    let seq = 1;
    const last = data?.[0]?.master_job_no;
    if (last && last.length >= 2) {
      const n = parseInt(last.slice(-2), 10);
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(2, '0')}`;
  }

  private async fetchBlLines(jobId: string) {
    const { data, error } = await supabase
      .from('fms_job_bl_lines')
      .select('*')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  private async replaceBlLines(jobId: string, lines: FmsJobBlLineInput[] | undefined) {
    if (lines === undefined) return;

    const { error: delErr } = await supabase.from('fms_job_bl_lines').delete().eq('job_id', jobId);
    if (delErr) throw delErr;

    if (lines.length === 0) return;

    const rows = lines.map((l, i) => ({
      job_id: jobId,
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
    }));

    const { error: insErr } = await supabase.from('fms_job_bl_lines').insert(rows);
    if (insErr) throw insErr;
  }

  private pickHeaderPayload(dto: CreateFmsJobDto | UpdateFmsJobDto): Record<string, unknown> {
    const { bl_lines: _bl, ...rest } = dto as CreateFmsJobDto;
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) payload[k] = v;
    }
    delete payload.bl_lines;
    return payload;
  }

  async findAll(page = 1, limit = 100): Promise<{ data: FmsJob[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('fms_jobs')
      .select(JOB_EMBEDS, { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_on', { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as FmsJob[];
    return { data: rows.map(normalizeWorkflowRow), count: count ?? 0 };
  }

  async findById(id: string): Promise<FmsJob | null> {
    const { data, error } = await supabase.from('fms_jobs').select(JOB_EMBEDS).eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const bl_lines = await this.fetchBlLines(id);
    return normalizeWorkflowRow({ ...(data as FmsJob), bl_lines });
  }

  async create(dto: CreateFmsJobDto, createdById?: string): Promise<FmsJob> {
    let master_job_no = (dto.master_job_no ?? '').trim();
    if (!master_job_no) {
      master_job_no = await this.nextMasterJobNo();
    }

    const headerPayload = this.pickHeaderPayload(dto);
    delete headerPayload.master_job_no;
    const insertPayload: Record<string, unknown> = {
      ...headerPayload,
      master_job_no,
      created_by_id: createdById ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: header, error: insErr } = await supabase
      .from('fms_jobs')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insErr) throw insErr;

    await this.replaceBlLines(header.id, dto.bl_lines);

    const full = await this.findById(header.id);
    if (!full) throw new AppError('Job create failed', 500);
    return full;
  }

  async update(id: string, dto: UpdateFmsJobDto): Promise<FmsJob> {
    const existing = await this.findById(id);
    if (!existing) throw new AppError('Job not found', 404);

    const headerPayload = this.pickHeaderPayload(dto);
    headerPayload.updated_at = new Date().toISOString();

    if (Object.keys(headerPayload).length > 0) {
      const { error: upErr } = await supabase.from('fms_jobs').update(headerPayload).eq('id', id);
      if (upErr) throw upErr;
    }

    if (dto.bl_lines !== undefined) {
      await this.replaceBlLines(id, dto.bl_lines);
    }

    const full = await this.findById(id);
    if (!full) throw new AppError('Job not found', 404);
    return full;
  }

  async updateWorkflow(id: string, workflow_status: FmsJob['workflow_status']): Promise<FmsJob> {
    const existing = await this.findById(id);
    if (!existing) throw new AppError('Job not found', 404);

    const { error } = await supabase
      .from('fms_jobs')
      .update({ workflow_status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return (await this.findById(id)) as FmsJob;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('fms_jobs').delete().eq('id', id);
    if (error) throw error;
  }
}
