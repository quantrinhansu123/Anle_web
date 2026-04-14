import { supabase } from '../../config/supabase';
import type {
  AccountingDashboardBankCard,
  AccountingDashboardChartBar,
  AccountingDashboardMetric,
  AccountingDashboardSummary,
} from './accounting-dashboard.types';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function monthKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = iso.slice(0, 7);
  return d.length === 7 ? d : null;
}

/** Last N calendar months as YYYY-MM (oldest first). */
function rollingMonthKeys(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    out.push(`${y}-${m}`);
  }
  return out;
}

function fillBars(keys: string[], sums: Map<string, number>): AccountingDashboardChartBar[] {
  return keys.map((label) => ({ label, value: sums.get(label) ?? 0 }));
}

function normalizeSparkline(values: number[], len: number): number[] {
  if (values.length >= len) return values.slice(-len);
  const pad = len - values.length;
  const head = Array(pad).fill(0);
  return [...head, ...values];
}

const OVERDUE_DAYS = 21;

export class AccountingDashboardService {
  async getSummary(): Promise<AccountingDashboardSummary> {
    const monthKeys = rollingMonthKeys(6);
    const cutoff = Date.now() - OVERDUE_DAYS * 86400000;

    const { data: invRows, error: invErr } = await supabase
      .from('fms_job_invoices')
      .select('id,status,payment_status,grand_total,created_at,updated_at');
    if (invErr) throw invErr;
    const invoices = invRows ?? [];

    let draftVal: AccountingDashboardMetric = { key: 'draft_validate', count: 0, amount: 0 };
    let unpaidVal: AccountingDashboardMetric = { key: 'unpaid', count: 0, amount: 0 };
    let overdueVal: AccountingDashboardMetric = { key: 'overdue', count: 0, amount: 0 };
    let partialVal: AccountingDashboardMetric = { key: 'partial_review', count: 0, amount: 0 };

    const invMonthPosted = new Map<string, number>();

    for (const r of invoices) {
      const gt = num(r.grand_total);
      const st = r.status as string;
      const ps = r.payment_status as string;
      const upd = r.updated_at ? new Date(String(r.updated_at)).getTime() : 0;
      const mk = monthKey(r.created_at as string);
      if (mk && st === 'posted') {
        invMonthPosted.set(mk, (invMonthPosted.get(mk) ?? 0) + gt);
      }

      if (st === 'draft') {
        draftVal = { ...draftVal, count: draftVal.count + 1, amount: draftVal.amount + gt };
      }
      if (st === 'posted' && (ps === 'unpaid' || ps === 'partial')) {
        unpaidVal = { ...unpaidVal, count: unpaidVal.count + 1, amount: unpaidVal.amount + gt };
        if (upd && upd < cutoff) {
          overdueVal = { ...overdueVal, count: overdueVal.count + 1, amount: overdueVal.amount + gt };
        }
      }
      if (st === 'posted' && ps === 'partial') {
        partialVal = { ...partialVal, count: partialVal.count + 1, amount: partialVal.amount + gt };
      }
    }

    const customerInvoices = {
      metrics: [draftVal, unpaidVal, overdueVal, partialVal],
      chartBars: fillBars(monthKeys, invMonthPosted),
    };

    const { data: pnRows, error: pnErr } = await supabase
      .from('fms_job_payment_notes')
      .select('id,status,created_at,updated_at');
    if (pnErr) throw pnErr;
    const notes = pnRows ?? [];

    const { data: lineRows, error: lineErr } = await supabase
      .from('fms_job_payment_note_lines')
      .select('payment_note_id, qty, rate');
    if (lineErr) throw lineErr;

    const noteTotals = new Map<string, number>();
    for (const ln of lineRows ?? []) {
      const id = ln.payment_note_id as string;
      const t = num(ln.qty) * num(ln.rate);
      noteTotals.set(id, (noteTotals.get(id) ?? 0) + t);
    }

    let vDraft: AccountingDashboardMetric = { key: 'vendor_draft_validate', count: 0, amount: 0 };
    let vPay: AccountingDashboardMetric = { key: 'vendor_to_pay', count: 0, amount: 0 };
    let vOver: AccountingDashboardMetric = { key: 'vendor_overdue', count: 0, amount: 0 };
    const vendorMonth = new Map<string, number>();

    for (const n of notes) {
      const id = n.id as string;
      const st = n.status as string;
      const amt = noteTotals.get(id) ?? 0;
      const upd = n.updated_at ? new Date(String(n.updated_at)).getTime() : 0;
      const mk = monthKey(n.created_at as string);
      if (mk && st !== 'cancel' && st !== 'billed') {
        vendorMonth.set(mk, (vendorMonth.get(mk) ?? 0) + amt);
      }
      if (st === 'draft') {
        vDraft = { ...vDraft, count: vDraft.count + 1, amount: vDraft.amount + amt };
      }
      if (st === 'approved' || st === 'partial_billed') {
        vPay = { ...vPay, count: vPay.count + 1, amount: vPay.amount + amt };
        if (upd && upd < cutoff) {
          vOver = { ...vOver, count: vOver.count + 1, amount: vOver.amount + amt };
        }
      }
    }

    const vendorBills = {
      metrics: [vDraft, vPay, vOver],
      chartBars: fillBars(monthKeys, vendorMonth),
    };

    const { data: ceRows, error: ceErr } = await supabase
      .from('customer_expenses')
      .select('status, amount, tax_amount, created_at');
    if (ceErr) throw ceErr;

    let miscDraft: AccountingDashboardMetric = { key: 'misc_draft_expenses', count: 0, amount: 0 };
    let miscSub: AccountingDashboardMetric = { key: 'misc_submitted', count: 0, amount: 0 };
    const miscMonth = new Map<string, number>();

    for (const r of ceRows ?? []) {
      const st = r.status as string;
      const line = num(r.amount) + num(r.tax_amount);
      const mk = monthKey(r.created_at as string);
      if (mk) miscMonth.set(mk, (miscMonth.get(mk) ?? 0) + line);
      if (st === 'draft') {
        miscDraft = { ...miscDraft, count: miscDraft.count + 1, amount: miscDraft.amount + line };
      }
      if (st === 'submitted' || st === 'under_validation') {
        miscSub = { ...miscSub, count: miscSub.count + 1, amount: miscSub.amount + line };
      }
    }

    const miscellaneous = {
      metrics: [miscDraft, miscSub],
      chartBars: fillBars(monthKeys, miscMonth),
    };

    const { data: advRows, error: advErr } = await supabase
      .from('salary_advance_requests')
      .select('amount, payment_status, created_at');
    if (advErr) throw advErr;

    let cashUnpaid: AccountingDashboardMetric = { key: 'cash_unpaid_advances', count: 0, amount: 0 };
    const cashMonth = new Map<string, number>();
    for (const r of advRows ?? []) {
      const mk = monthKey(r.created_at as string);
      const a = num(r.amount);
      if (mk) cashMonth.set(mk, (cashMonth.get(mk) ?? 0) + a);
      if (r.payment_status === 'unpaid') {
        cashUnpaid = { ...cashUnpaid, count: cashUnpaid.count + 1, amount: cashUnpaid.amount + a };
      }
    }

    const cash = {
      metrics: [cashUnpaid],
      sparkline: monthKeys.map((k) => cashMonth.get(k) ?? 0),
    };

    const { data: prRows, error: prErr } = await supabase
      .from('payment_requests')
      .select('id, account_name, account_number, bank_name, created_at')
      .order('created_at', { ascending: false })
      .limit(8);
    if (prErr) throw prErr;

    let priRows: { payment_request_id: string; payable_amount: unknown; date_issue: string | null }[] = [];
    const { data: pri, error: priErr } = await supabase
      .from('payment_request_invoices')
      .select('payment_request_id, payable_amount, date_issue');
    if (!priErr) priRows = (pri ?? []) as typeof priRows;

    const prTotals = new Map<string, number>();
    const prMonth = new Map<string, Map<string, number>>();
    for (const row of priRows) {
      const id = row.payment_request_id;
      const p = num(row.payable_amount);
      prTotals.set(id, (prTotals.get(id) ?? 0) + p);
      const mk = monthKey(row.date_issue ?? undefined);
      if (mk) {
        if (!prMonth.has(id)) prMonth.set(id, new Map());
        const m = prMonth.get(id)!;
        m.set(mk, (m.get(mk) ?? 0) + p);
      }
    }

    let bankAccounts: AccountingDashboardBankCard[] = (prRows ?? []).slice(0, 2).map((pr) => {
      const id = pr.id as string;
      const name =
        (pr.account_name as string)?.trim() ||
        (pr.bank_name as string)?.trim() ||
        (pr.account_number as string)?.trim() ||
        'Bank account';
      const unpaid = prTotals.get(id) ?? 0;
      const m = prMonth.get(id) ?? new Map<string, number>();
      const spark = monthKeys.map((k) => m.get(k) ?? 0);
      return {
        id,
        displayName: name,
        subtitle: (pr.bank_name as string) || null,
        unpaidTotal: unpaid,
        sparkline: normalizeSparkline(spark, monthKeys.length),
      };
    });

    if (bankAccounts.length === 0) {
      bankAccounts = [
        {
          id: 'placeholder-1',
          displayName: 'Bank account',
          subtitle: 'No payment requests yet',
          unpaidTotal: 0,
          sparkline: monthKeys.map(() => 0),
        },
        {
          id: 'placeholder-2',
          displayName: 'Bank account 2',
          subtitle: 'Connect your bank',
          unpaidTotal: 0,
          sparkline: monthKeys.map(() => 0),
        },
      ];
    } else if (bankAccounts.length === 1) {
      bankAccounts.push({
        id: 'placeholder-2',
        displayName: 'Bank account 2',
        subtitle: 'Connect your bank',
        unpaidTotal: 0,
        sparkline: monthKeys.map(() => 0),
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      customerInvoices,
      vendorBills,
      miscellaneous,
      cash,
      bankAccounts,
    };
  }
}
