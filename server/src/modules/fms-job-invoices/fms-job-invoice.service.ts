import { supabase } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import type {
  CreateFmsJobInvoiceDto,
  FmsJobInvoice,
  FmsJobInvoiceListFilters,
  FmsJobInvoiceListItem,
  RecordFmsJobInvoicePaymentDto,
  UpdateFmsJobInvoiceDto,
} from './fms-job-invoice.types';

async function assertShipmentExists(shipmentId: string): Promise<void> {
  const { data, error } = await supabase.from('shipments').select('id').eq('id', shipmentId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Shipment not found', 404);
}

async function allocateInvoiceNo(series: 'INV' | 'BILL'): Promise<string> {
  const { data, error } = await supabase.rpc('next_fms_job_invoice_no', { p_series: series });
  if (error) throw error;
  if (typeof data !== 'string' || !data) {
    throw new AppError('Failed to allocate invoice number', 500);
  }
  return data;
}

function parseCsvParam(v: unknown): string[] | undefined {
  if (v == null || v === '') return undefined;
  if (Array.isArray(v))
    return v.flatMap((s) => String(s).split(',')).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

type JobLite = {
  id: string;
  master_job_no: string;
  customers?: { company_name?: string } | null;
};

type DebitNoteLite = { id: string; no_doc: string };

function computeLineUntaxed(lines: unknown): number {
  if (!Array.isArray(lines)) return 0;
  let sum = 0;
  for (const raw of lines) {
    const ln = raw as Record<string, unknown>;
    sum += Number(ln.quantity ?? 0) * Number(ln.price ?? 0);
  }
  return sum;
}

function toListItem(
  inv: FmsJobInvoice,
  job?: JobLite | null,
  dn?: DebitNoteLite | null,
): FmsJobInvoiceListItem {
  const payload = (inv.payload || {}) as Record<string, unknown>;
  const untaxed = computeLineUntaxed(inv.lines);
  const gt = Number(inv.grand_total) || 0;
  const taxAmount = Math.max(0, gt - untaxed);
  const customerFromPayload =
    typeof payload.customer === 'string' && payload.customer.trim() ? payload.customer.trim() : null;
  const customerName = customerFromPayload || job?.customers?.company_name?.trim() || null;
  const invoiceDate =
    typeof payload.invoice_date === 'string' && payload.invoice_date
      ? payload.invoice_date.slice(0, 10)
      : inv.created_at?.slice(0, 10) ?? null;
  const dueDate =
    typeof payload.due_date === 'string' && payload.due_date ? payload.due_date.slice(0, 10) : null;
  const originalInvoiceNo =
    typeof payload.original_invoice_no === 'string' && payload.original_invoice_no.trim()
      ? payload.original_invoice_no.trim()
      : null;
  const currency =
    typeof payload.currency === 'string' && payload.currency.trim()
      ? payload.currency.trim()
      : 'VND';

  return {
    id: inv.id,
    job_id: inv.job_id,
    debit_note_id: inv.debit_note_id,
    invoice_no: inv.invoice_no,
    status: inv.status,
    payment_status: inv.payment_status,
    grand_total: inv.grand_total,
    created_at: inv.created_at,
    updated_at: inv.updated_at,
    master_job_no: job?.master_job_no ?? null,
    customer_name: customerName,
    debit_note_no: dn?.no_doc ?? null,
    invoice_date: invoiceDate,
    due_date: dueDate,
    original_invoice_no: originalInvoiceNo,
    currency,
    untaxed_amount: untaxed,
    tax_amount: taxAmount,
  };
}

async function assertDebitNoteBelongsToShipment(shipmentId: string, debitNoteId: string): Promise<void> {
  const { data, error } = await supabase
    .from('fms_job_debit_notes')
    .select('id')
    .eq('id', debitNoteId)
    .eq('shipment_id', shipmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Debit Note not found for this shipment', 404);
}

export class FmsJobInvoiceService {
  private async syncDebitNoteStatusFromPaymentStatus(
    debitNoteId: string,
    paymentStatus: 'unpaid' | 'partial' | 'paid',
  ): Promise<void> {
    if (paymentStatus !== 'paid' && paymentStatus !== 'partial') return;
    const nextDnStatus = paymentStatus === 'paid' ? 'invoiced' : 'partial_invoiced';
    const { error } = await supabase
      .from('fms_job_debit_notes')
      .update({ status: nextDnStatus, updated_at: new Date().toISOString() })
      .eq('id', debitNoteId);
    if (error) throw error;
  }

  async listByJob(shipmentId: string): Promise<FmsJobInvoice[]> {
    await assertShipmentExists(shipmentId);
    const { data, error } = await supabase
      .from('fms_job_invoices')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FmsJobInvoice[];
  }

  async findById(shipmentId: string, invoiceId: string): Promise<FmsJobInvoice | null> {
    const { data, error } = await supabase
      .from('fms_job_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shipment_id', shipmentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data as FmsJobInvoice;
  }

  async create(shipmentId: string, dto: CreateFmsJobInvoiceDto): Promise<FmsJobInvoice> {
    await assertShipmentExists(shipmentId);
    await assertDebitNoteBelongsToShipment(shipmentId, dto.debit_note_id);

    const status = dto.status ?? 'draft';
    const lines = dto.lines ?? [];
    const payload = dto.payload ?? {};
    const invoiceNo = await allocateInvoiceNo(dto.number_series);

    const { data, error } = await supabase
      .from('fms_job_invoices')
      .insert({
        shipment_id: shipmentId,
        debit_note_id: dto.debit_note_id,
        invoice_no: invoiceNo,
        status,
        payment_status: 'unpaid',
        grand_total: dto.grand_total ?? null,
        lines,
        payload,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as FmsJobInvoice;
  }

  async update(shipmentId: string, invoiceId: string, dto: UpdateFmsJobInvoiceDto): Promise<FmsJobInvoice> {
    const existing = await this.findById(shipmentId, invoiceId);
    if (!existing) throw new AppError('Invoice not found', 404);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.invoice_no !== undefined) patch.invoice_no = dto.invoice_no;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.grand_total !== undefined) patch.grand_total = dto.grand_total;
    if (dto.lines !== undefined) patch.lines = dto.lines;
    if (dto.payload !== undefined) patch.payload = dto.payload;
    if (dto.payment_status !== undefined) patch.payment_status = dto.payment_status;

    const { data, error } = await supabase
      .from('fms_job_invoices')
      .update(patch)
      .eq('id', invoiceId)
      .eq('shipment_id', shipmentId)
      .select('*')
      .single();

    if (error) throw error;

    if (dto.payment_status !== undefined) {
      await this.syncDebitNoteStatusFromPaymentStatus(existing.debit_note_id, dto.payment_status);
    }

    return data as FmsJobInvoice;
  }

  async delete(shipmentId: string, invoiceId: string): Promise<void> {
    const existing = await this.findById(shipmentId, invoiceId);
    if (!existing) throw new AppError('Invoice not found', 404);
    if (existing.status !== 'draft') {
      throw new AppError('Only draft invoices can be deleted', 400);
    }
    const { error } = await supabase.from('fms_job_invoices').delete().eq('id', invoiceId).eq('shipment_id', shipmentId);
    if (error) throw error;
  }

  async recordPayment(
    shipmentId: string,
    invoiceId: string,
    dto: RecordFmsJobInvoicePaymentDto,
  ): Promise<{ result: unknown; invoice: FmsJobInvoice }> {
    await assertShipmentExists(shipmentId);
    const existing = await this.findById(shipmentId, invoiceId);
    if (!existing) throw new AppError('Invoice not found', 404);

    const paymentDate = dto.payment_date ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc('record_fms_job_invoice_payment', {
      p_job_id: shipmentId,
      p_invoice_id: invoiceId,
      p_journal: dto.journal ?? null,
      p_payment_method: dto.payment_method ?? null,
      p_amount: dto.amount,
      p_payment_date: paymentDate,
      p_memo: dto.memo ?? null,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('invoice_not_found')) throw new AppError('Invoice not found', 404);
      if (msg.includes('invoice_not_posted')) throw new AppError('Invoice must be posted before recording payment', 400);
      if (msg.includes('invalid_amount')) throw new AppError('Invalid payment amount', 400);
      throw error;
    }

    const invoice = await this.findById(shipmentId, invoiceId);
    return { result: data, invoice: invoice as FmsJobInvoice };
  }

  /**
   * Paginated list of all job invoices (cross-job), with job/customer/debit note labels for list UI.
   */
  async findAllGlobal(
    page = 1,
    limit = 20,
    filters: FmsJobInvoiceListFilters = {},
  ): Promise<{ data: FmsJobInvoiceListItem[]; count: number }> {
    const from = (page - 1) * limit;
    const f = filters;

    if (f.search?.trim()) {
      const term = f.search.trim();
      const { data: shipments, error: sErr } = await supabase
        .from('shipments')
        .select('id')
        .ilike('master_job_no', `%${term}%`);
      if (sErr) throw sErr;
      const shipmentIdsFromNo = (shipments ?? []).map((s) => s.id as string);
      const orParts = [`invoice_no.ilike.%${term}%`];
      if (shipmentIdsFromNo.length > 0) {
        orParts.push(`shipment_id.in.(${shipmentIdsFromNo.join(',')})`);
      }

      let q = supabase
        .from('fms_job_invoices')
        .select('*', { count: 'exact' })
        .or(orParts.join(','))
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (f.status && f.status.length > 0) q = q.in('status', f.status);
      if (f.payment_status && f.payment_status.length > 0) {
        q = q.in('payment_status', f.payment_status);
      }
      if (f.job_id && f.job_id.length > 0) q = q.in('shipment_id', f.job_id);

      const { data, error, count } = await q;
      if (error) throw error;
      const rows = (data ?? []) as FmsJobInvoice[];
      const mapped = await this.hydrateListRows(rows);
      return { data: mapped, count: count ?? 0 };
    }

    let q = supabase
      .from('fms_job_invoices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (f.status && f.status.length > 0) q = q.in('status', f.status);
    if (f.payment_status && f.payment_status.length > 0) {
      q = q.in('payment_status', f.payment_status);
    }
    if (f.job_id && f.job_id.length > 0) q = q.in('shipment_id', f.job_id);

    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data ?? []) as FmsJobInvoice[];
    const mapped = await this.hydrateListRows(rows);
    return { data: mapped, count: count ?? 0 };
  }

  private async hydrateListRows(rows: FmsJobInvoice[]): Promise<FmsJobInvoiceListItem[]> {
    if (rows.length === 0) return [];

    const shipmentIds = [...new Set(rows.map((r) => r.shipment_id))];
    const dnIds = [...new Set(rows.map((r) => r.debit_note_id))];

    const { data: shipmentRows, error: sErr } = await supabase
      .from('shipments')
      .select('id, master_job_no, customers(company_name)')
      .in('id', shipmentIds);
    if (sErr) throw sErr;
    const shipmentMap = new Map<string, JobLite>();
    for (const row of shipmentRows ?? []) {
      const id = row.id as string;
      const raw = row as unknown as {
        master_job_no: string;
        customers?: { company_name?: string } | { company_name?: string }[] | null;
      };
      let customers: { company_name?: string } | null = null;
      const c = raw.customers;
      if (Array.isArray(c)) customers = c[0] ?? null;
      else if (c && typeof c === 'object') customers = c as { company_name?: string };
      shipmentMap.set(id, { id, master_job_no: raw.master_job_no, customers });
    }

    const { data: dnRows, error: dnErr } = await supabase
      .from('fms_job_debit_notes')
      .select('id, no_doc')
      .in('id', dnIds);
    if (dnErr) throw dnErr;
    const dnMap = new Map<string, DebitNoteLite>(
      (dnRows ?? []).map((d) => [d.id as string, d as DebitNoteLite]),
    );

    return rows.map((inv) =>
      toListItem(inv, shipmentMap.get(inv.shipment_id) ?? null, dnMap.get(inv.debit_note_id) ?? null),
    );
  }
}

export function parseFmsJobInvoiceListFiltersFromQuery(
  query: Record<string, unknown>,
): FmsJobInvoiceListFilters {
  return {
    search: typeof query.search === 'string' ? query.search : undefined,
    status: parseCsvParam(query.status),
    payment_status: parseCsvParam(query.payment_status),
    job_id: parseCsvParam(query.job_id),
  };
}
