import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ChevronLeft,
  FileText,
  Plus,
  Send,
  Trash2,
  XCircle,
  CreditCard,
  ListPlus,
  Receipt,
} from 'lucide-react';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { WorkflowStepper } from '../../components/ui/WorkflowStepper';
import { useToastContext } from '../../contexts/ToastContext';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { jobService } from '../../services/jobService';
import { salesService } from '../../services/salesService';
import { buildDnLineSeedsFromSales } from './mapQuotationToDebitNoteLines';
import { fmsJobDebitNoteService } from '../../services/fmsJobDebitNoteService';
import { fmsJobInvoiceService } from '../../services/fmsJobInvoiceService';
import type { FmsJobDebitNoteLineDto } from '../../services/fmsJobDebitNoteService';
import { FieldLabel, inputClass } from './tabs/blSharedHelpers';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DNStatus = 'draft' | 'sent' | 'invoiced' | 'partial_invoiced' | 'cancel';

interface ServiceLine {
  id: string;
  service_code: string;
  fare: string;
  fare_type: string;
  fare_name: string;
  tax: string;
  currency: string;
  exchange_rate: number;
  unit: string;
  qty: number;
  rate: number;
  amount_foreign: number;
  local_amount: number;
  vat_foreign: number;
  vat_local: number;
}

interface InvoiceDraftPayload {
  fromDebitNoteId?: string;
  fromDebitNoteNo: string;
  customer: string;
  description: string;
  invoiceDate: string;
  dueDate: string;
  exchangeRate: string;
  journal: string;
  lines: Array<{
    product: string;
    description: string;
    account: string;
    quantity: number;
    unit: string;
    price: number;
    tax: string;
  }>;
}

const CURRENCIES = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CNY', label: 'CNY' },
];

const TAX_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'vat_added', label: 'Value Added' },
  { value: 'vat_10', label: 'VAT 10%' },
  { value: 'vat_8', label: 'VAT 8%' },
  { value: 'exempt', label: 'Exempt' },
];

const FARE_TYPES = [
  { value: 'freight', label: 'Freight' },
  { value: 'surcharge', label: 'Surcharge' },
  { value: 'customs', label: 'Customs Fee' },
  { value: 'handling', label: 'Handling' },
  { value: 'storage', label: 'Storage' },
  { value: 'other', label: 'Other' },
];

let _lineId = 0;
const nextLineId = () => `dn-line-${++_lineId}`;

const emptyLine = (): ServiceLine => ({
  id: nextLineId(),
  service_code: '',
  fare: '',
  fare_type: '',
  fare_name: '',
  tax: '',
  currency: 'VND',
  exchange_rate: 1,
  unit: '',
  qty: 1,
  rate: 0,
  amount_foreign: 0,
  local_amount: 0,
  vat_foreign: 0,
  vat_local: 0,
});

function enrichLine(l: Partial<ServiceLine> & { id: string }): ServiceLine {
  const qty = Number(l.qty ?? 1);
  const rate = Number(l.rate ?? 0);
  const exchange_rate = Number(l.exchange_rate ?? 1);
  const tax = l.tax ?? '';
  const taxRate =
    tax === 'vat_10' ? 0.1 : tax === 'vat_8' ? 0.08 : tax === 'vat_added' ? 0.1 : 0;
  const amtForeign = qty * rate;
  const localAmt = amtForeign * exchange_rate;
  const vatForeign = amtForeign * taxRate;
  const vatLocal = localAmt * taxRate;
  return {
    id: l.id,
    service_code: l.service_code ?? '',
    fare: l.fare ?? '',
    fare_type: l.fare_type ?? '',
    fare_name: l.fare_name ?? '',
    tax,
    currency: l.currency ?? 'VND',
    exchange_rate,
    unit: l.unit ?? '',
    qty,
    rate,
    amount_foreign: amtForeign,
    local_amount: localAmt,
    vat_foreign: vatForeign,
    vat_local: vatLocal,
  };
}

function linesToDto(lines: ServiceLine[]): FmsJobDebitNoteLineDto[] {
  return lines.map((line, idx) => ({
    sort_order: idx,
    service_code: line.service_code || null,
    fare: line.fare || null,
    fare_type: line.fare_type || null,
    fare_name: line.fare_name || null,
    tax: line.tax || null,
    currency: line.currency || null,
    exchange_rate: line.exchange_rate,
    unit: line.unit || null,
    qty: line.qty,
    rate: line.rate,
  }));
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
      <div
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          color,
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-black tracking-tight text-slate-900 leading-tight">
          {value}
        </p>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                     */
/* ------------------------------------------------------------------ */

const fmtNumber = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );

const fmtCurrency = (n: number, curr: string) => `${fmtNumber(n)} ${curr === 'VND' ? 'đ' : curr}`;

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

const DebitNotePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: jobId, dnId } = useParams<{ id: string; dnId?: string }>();
  const { success: toastOk, error: toastErr } = useToastContext();
  const { setCustomBreadcrumbs } = useBreadcrumb();

  /* DN fields */
  const [dnNo, setDnNo] = useState('');
  const [status, setStatus] = useState<DNStatus>('draft');

  /* Party information */
  const [customer, setCustomer] = useState('');
  const [customerDisplay, setCustomerDisplay] = useState('');
  const [shipper, setShipper] = useState('');
  const [consignee, setConsignee] = useState('');
  const [salesman, setSalesman] = useState('');
  const [salesmanTeam, setSalesmanTeam] = useState('');
  const [salesDepartment, setSalesDepartment] = useState('');

  /* Internal information */
  const [jobNo, setJobNo] = useState('');
  const [masterBl, setMasterBl] = useState('');
  const [houseBl, setHouseBl] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [createdOn, setCreatedOn] = useState('');

  /* Accounting information */
  const [billingDate, setBillingDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [exchangeRate, setExchangeRate] = useState('');
  const [exchangeCurrency, setExchangeCurrency] = useState('USD');

  /* Exchange rates fetched from server */
  const [exchangeRateOptions, setExchangeRateOptions] = useState<{ value: string, label: string, rate: number }[]>([]);

  // Fetch exchange rates
  useEffect(() => {
    void (async () => {
      try {
        const { exchangeRateService } = await import('../../services/exchangeRateService');
        const rates = await exchangeRateService.getAll();
        const options = rates
          .filter(r => r.currency_code.trim().toUpperCase() !== 'VND')
          .map(r => ({
            value: r.currency_code.toUpperCase(),
            label: `VND/${r.currency_code.toUpperCase()}`,
            rate: r.rate
          }));

        // Add defaults if missing
        const existCodes = options.map(o => o.value);
        if (!existCodes.includes('USD')) options.push({ value: 'USD', label: 'VND/USD', rate: 25450 });
        if (!existCodes.includes('EUR')) options.push({ value: 'EUR', label: 'VND/EUR', rate: 27500 });

        setExchangeRateOptions(options);

        // Auto-set the rate for the default selected currency if not already set manually
        if (!exchangeRate) {
          const currMap = options.find(o => o.value === 'USD');
          if (currMap) {
            setExchangeRate(currMap.rate.toString());
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleCurrencyChange = (currCode: string) => {
    setExchangeCurrency(currCode);
    const opt = exchangeRateOptions.find(o => o.value === currCode);
    if (opt) {
      setExchangeRate(opt.rate.toString());
    }
  };

  /* Service lines */
  const [lines, setLines] = useState<ServiceLine[]>([emptyLine(), emptyLine()]);

  /* Remark */
  const [remark, setRemark] = useState('');

  /* Bank */
  const [bank, setBank] = useState('');

  /* Payment */
  const [paidAmount, _setPaidAmount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);

  /* Labels from job */
  const [masterJobLabel, setMasterJobLabel] = useState('');
  const [quotationIdFromJob, setQuotationIdFromJob] = useState<string | null>(null);
  const [importingQuotationLines, setImportingQuotationLines] = useState(false);

  const buildDnPayload = useCallback((): Record<string, unknown> => {
    return {
      customer,
      customer_display: customerDisplay,
      shipper,
      consignee,
      salesman,
      salesman_team: salesmanTeam,
      sales_department: salesDepartment,
      job_no: jobNo,
      master_bl: masterBl,
      house_bl: houseBl,
      reference_no: referenceNo,
      created_by: createdBy,
      created_on: createdOn,
      billing_date: billingDate,
      due_date: dueDate,
      exchange_rate: exchangeRate,
      exchange_currency: exchangeCurrency,
      remark,
      bank,
    };
  }, [
    bank,
    billingDate,
    consignee,
    createdBy,
    createdOn,
    customer,
    customerDisplay,
    dueDate,
    exchangeCurrency,
    exchangeRate,
    houseBl,
    jobNo,
    masterBl,
    referenceNo,
    remark,
    salesDepartment,
    salesman,
    salesmanTeam,
    shipper,
  ]);

  const persistSnapshot = useMemo(
    () =>
      JSON.stringify({
        dnNo,
        status,
        payload: buildDnPayload(),
        lines,
      }),
    [buildDnPayload, dnNo, lines, status],
  );

  const dnHydratedRef = useRef(false);
  const omitDnAutosaveRef = useRef(true);
  const [dnAutosaveEpoch, setDnAutosaveEpoch] = useState(0);

  /* Load existing FMS debit note */
  useEffect(() => {
    if (!jobId || !dnId) {
      dnHydratedRef.current = false;
      return;
    }
    omitDnAutosaveRef.current = true;
    dnHydratedRef.current = false;
    let cancelled = false;
    void (async () => {
      try {
        const dn = await fmsJobDebitNoteService.get(jobId, dnId);
        if (cancelled) return;
        setDnNo(dn.no_doc);
        setStatus((dn.status as DNStatus) || 'draft');
        const p = (dn.payload || {}) as Record<string, unknown>;
        if (typeof p.customer === 'string') setCustomer(p.customer);
        if (typeof p.customer_display === 'string') setCustomerDisplay(p.customer_display);
        else if (typeof p.customerDisplay === 'string') setCustomerDisplay(p.customerDisplay);
        if (typeof p.shipper === 'string') setShipper(p.shipper);
        if (typeof p.consignee === 'string') setConsignee(p.consignee);
        if (typeof p.salesman === 'string') setSalesman(p.salesman);
        if (typeof p.salesman_team === 'string') setSalesmanTeam(p.salesman_team);
        if (typeof p.salesmanTeam === 'string') setSalesmanTeam(p.salesmanTeam);
        if (typeof p.sales_department === 'string') setSalesDepartment(p.sales_department);
        if (typeof p.job_no === 'string') setJobNo(p.job_no);
        if (typeof p.master_bl === 'string') setMasterBl(p.master_bl);
        if (typeof p.house_bl === 'string') setHouseBl(p.house_bl);
        if (typeof p.reference_no === 'string') setReferenceNo(p.reference_no);
        if (typeof p.created_by === 'string') setCreatedBy(p.created_by);
        if (typeof p.created_on === 'string') setCreatedOn(p.created_on);
        if (typeof p.billing_date === 'string') setBillingDate(p.billing_date);
        if (typeof p.due_date === 'string') setDueDate(p.due_date);
        if (typeof p.exchange_rate === 'string') setExchangeRate(p.exchange_rate);
        if (typeof p.exchange_currency === 'string') setExchangeCurrency(p.exchange_currency);
        if (typeof p.remark === 'string') setRemark(p.remark);
        if (typeof p.bank === 'string') setBank(p.bank);

        if (dn.lines && dn.lines.length > 0) {
          const sorted = [...dn.lines].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
          setLines(
            sorted.map((row) =>
              enrichLine({
                id: row.id,
                service_code: row.service_code ?? undefined,
                fare: row.fare ?? undefined,
                fare_type: row.fare_type ?? undefined,
                fare_name: row.fare_name ?? undefined,
                tax: row.tax ?? undefined,
                currency: row.currency ?? undefined,
                exchange_rate: row.exchange_rate ?? undefined,
                unit: row.unit ?? undefined,
                qty: row.qty ?? undefined,
                rate: row.rate ?? undefined,
              }),
            ),
          );
        }
        dnHydratedRef.current = true;
        window.setTimeout(() => {
          omitDnAutosaveRef.current = false;
          setDnAutosaveEpoch((n) => n + 1);
        }, 600);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load debit note';
        toastErr(msg);
        dnHydratedRef.current = true;
        omitDnAutosaveRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dnId, jobId, toastErr]);

  /* Debounced autosave for persisted debit notes */
  useEffect(() => {
    if (!jobId || !dnId || !dnHydratedRef.current || omitDnAutosaveRef.current) return;
    const t = window.setTimeout(() => {
      void fmsJobDebitNoteService
        .update(jobId, dnId, {
          no_doc: dnNo,
          status,
          payload: buildDnPayload(),
          lines: linesToDto(lines),
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'Autosave failed';
          toastErr(msg);
        });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [buildDnPayload, dnAutosaveEpoch, dnId, jobId, persistSnapshot, toastErr]);

  /* Fetch job data */
  useEffect(() => {
    if (!jobId) return;
    void (async () => {
      try {
        const job = await jobService.getJob(jobId);
        const mjn = job.master_job_no || '';
        setJobNo(mjn);
        setMasterJobLabel(mjn);
        setCustomer(job.customers?.company_name || '');
        setCustomerDisplay(job.customers?.company_name || '');
        setSalesman(job.salesperson?.full_name || '');
        setSalesmanTeam(job.sales_team || '');
        setSalesDepartment(job.sales_department || '');
        setCreatedBy(job.created_by?.full_name || '');
        setCreatedOn(
          job.created_on
            ? new Date(job.created_on).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
            : '',
        );
        setMasterBl(job.master_bl_number || '');
        setQuotationIdFromJob(job.quotation_id || null);
      } catch {
        /* ignore */
      }
    })();
  }, [jobId]);

  const handleImportLinesFromQuotation = useCallback(async () => {
    if (!quotationIdFromJob) return;
    setImportingQuotationLines(true);
    try {
      const sales = await salesService.getSalesItemById(quotationIdFromJob);
      const seeds = buildDnLineSeedsFromSales(sales);
      if (seeds.length === 0) {
        toastErr('This quotation has no charge or service lines to import.');
        return;
      }
      setLines(seeds.map((s) => enrichLine({ id: nextLineId(), ...s })));
      toastOk(`Imported ${seeds.length} line(s) from quotation.`);
    } catch (e: unknown) {
      toastErr(e instanceof Error ? e.message : 'Failed to load quotation');
    } finally {
      setImportingQuotationLines(false);
    }
  }, [quotationIdFromJob, toastErr, toastOk]);

  /* Stat cards: invoices and payments linked to this debit note */
  useEffect(() => {
    if (!jobId || !dnId) {
      setInvoiceCount(0);
      setPaymentCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const invoices = await fmsJobInvoiceService.list(jobId);
        if (cancelled) return;
        const linked = invoices.filter((inv) => inv.debit_note_id === dnId);
        setInvoiceCount(linked.length);
        setPaymentCount(linked.filter((inv) => inv.payment_status !== 'unpaid').length);
      } catch {
        if (cancelled) return;
        setInvoiceCount(0);
        setPaymentCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, dnId, status]);

  /* Generate DN number */
  useEffect(() => {
    if (!dnId) {
      const ts = Date.now().toString(36).toUpperCase();
      setDnNo(`DN-${ts}`);
    }
  }, [dnId]);

  /* Custom breadcrumbs */
  useEffect(() => {
    const jobLabel =
      masterJobLabel || (jobId ? `Job ${jobId.slice(0, 8)}...` : 'New Job');
    setCustomBreadcrumbs([
      { path: '/shipping', label: 'Shipping' },
      { path: '/shipping/jobs', label: 'Job Management' },
      ...(jobId
        ? [{ path: `/shipping/jobs/${jobId}/edit`, label: jobLabel }]
        : []),
      {
        path: `/shipping/jobs/${jobId || 'new'}/sea-house-bl`,
        label: 'Sea House B/L',
      },
      {
        path: dnId
          ? `/shipping/jobs/${jobId || 'new'}/sea-house-bl/debit-note/${dnId}`
          : `/shipping/jobs/${jobId || 'new'}/sea-house-bl/debit-note`,
        label: dnNo || 'Debit Note',
      },
    ]);
    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [dnId, jobId, masterJobLabel, dnNo, setCustomBreadcrumbs]);

  /* Line helpers */
  const updateLine = (id: string, patch: Partial<ServiceLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const merged = { ...l, ...patch };
        // Recalculate
        const amtForeign = merged.qty * merged.rate;
        const localAmt = amtForeign * merged.exchange_rate;
        const taxRate = merged.tax === 'vat_10' ? 0.1 : merged.tax === 'vat_8' ? 0.08 : merged.tax === 'vat_added' ? 0.1 : 0;
        const vatForeign = amtForeign * taxRate;
        const vatLocal = localAmt * taxRate;
        return {
          ...merged,
          amount_foreign: amtForeign,
          local_amount: localAmt,
          vat_foreign: vatForeign,
          vat_local: vatLocal,
        };
      }),
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));

  /* Totals */
  const untaxedAmount = useMemo(
    () => lines.reduce((s, l) => s + l.local_amount, 0),
    [lines],
  );
  const taxedAmount = useMemo(
    () => lines.reduce((s, l) => s + l.vat_local, 0),
    [lines],
  );
  const totalAmount = untaxedAmount + taxedAmount;
  const residualAmount = totalAmount - paidAmount;

  /* Table horizontal scroll ref */
  const tableWrapRef = useRef<HTMLDivElement>(null);

  const taxLabelForInvoice = (tax: string) => {
    if (tax === 'vat_10' || tax === 'vat_added') return 'VAT 10%';
    if (tax === 'vat_8') return 'VAT 8%';
    if (tax === 'exempt') return 'Exempt';
    return 'None';
  };

  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  const handleCreateInvoice = async () => {
    if (!jobId) {
      toastErr('Missing job');
      return;
    }
    const params = new URLSearchParams();
    params.set('jobId', jobId);
    if (jobNo) params.set('jobNo', jobNo);
    if (dnNo) params.set('dnNo', dnNo);

    const invoiceLines = lines.map((line) => ({
      product: line.service_code,
      description: line.fare_name || line.fare,
      account: '5113 Service Revenue',
      quantity: Number(line.qty || 0),
      unit: line.unit,
      price: Number(line.rate || 0),
      tax: taxLabelForInvoice(line.tax),
    }));

    const invoiceDraft: InvoiceDraftPayload = {
      fromDebitNoteId: dnId,
      fromDebitNoteNo: dnNo,
      customer: customerDisplay || customer,
      description: remark,
      invoiceDate: billingDate,
      dueDate,
      exchangeRate,
      journal: 'Customer Invoices',
      lines: invoiceLines,
    };

    setInvoiceSubmitting(true);
    try {
      const lineDtos = linesToDto(lines);
      let realDnId = dnId;
      if (!realDnId) {
        const created = await fmsJobDebitNoteService.create(jobId, {
          no_doc: dnNo || `DN-${Date.now().toString(36)}`,
          status,
          payload: buildDnPayload(),
          lines: lineDtos,
        });
        realDnId = created.id;
      } else {
        await fmsJobDebitNoteService.update(jobId, realDnId, {
          no_doc: dnNo,
          status,
          payload: buildDnPayload(),
          lines: lineDtos,
        });
      }

      const inv = await fmsJobInvoiceService.create(jobId, {
        debit_note_id: realDnId,
        number_series: 'INV',
        status: 'draft',
        grand_total: totalAmount,
        lines: invoiceLines,
        payload: {
          customer: customerDisplay || customer,
          description: remark,
          invoice_date: billingDate,
          due_date: dueDate,
          exchange_rate: exchangeRate,
          journal: 'Customer Invoices',
        },
      });

      params.set('invoiceId', inv.id);
      params.set('dnId', realDnId);

      navigate(`/financials/invoicing${params.toString() ? `?${params.toString()}` : ''}`, {
        state: { invoiceDraft },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not create invoice';
      toastErr(msg);
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 mx-auto flex w-full flex-col gap-4 px-0 pb-24 sm:px-1 md:pb-6">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="relative overflow-visible rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-white via-white to-slate-50/40 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
          {/* Left: back + DN No */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                jobId
                  ? navigate(`/shipping/jobs/${jobId}/sea-house-bl`)
                  : navigate('/shipping/jobs')
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary touch-manipulation"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary leading-none mb-0.5">DN No.</p>
              <input
                value={dnNo}
                onChange={(e) => setDnNo(e.target.value)}
                className="text-2xl font-black tracking-tight text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-300"
                placeholder="SOTAHDN0000000"
              />
            </div>
          </div>

          {/* Right: Status stepper */}
          <div className="flex items-center gap-4 overflow-x-auto lg:shrink-0">
            {quotationIdFromJob && jobId && !dnId ? (
              <button
                type="button"
                onClick={() => void handleImportLinesFromQuotation()}
                disabled={importingQuotationLines}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-[11px] font-bold uppercase tracking-wide text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <ListPlus size={14} />
                {importingQuotationLines ? 'Loading…' : 'Import from quotation'}
              </button>
            ) : null}
            {status === 'sent' && (
              <button
                type="button"
                onClick={() => void handleCreateInvoice()}
                disabled={invoiceSubmitting}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Receipt size={14} />
                {invoiceSubmitting ? 'Working…' : 'Create Invoice'}
              </button>
            )}
            <WorkflowStepper
              steps={[
                { id: 'draft', label: 'Draft', icon: FileText },
                { id: 'sent', label: 'Sent', icon: Send },
                { id: 'invoiced', label: 'Invoiced', icon: Receipt },
                { id: 'partial_invoiced', label: 'Partial Invoiced', icon: CreditCard },
                { id: 'cancel', label: 'Cancel', icon: XCircle, isCancel: true },
              ]}
              currentStep={status}
              onStepChange={(s) => {
                setStatus(s as DNStatus);
                const statusLabels: Record<string, string> = {
                  draft: 'Draft',
                  sent: 'Sent',
                  invoiced: 'Invoiced',
                  partial_invoiced: 'Partial Invoiced',
                  cancel: 'Cancelled',
                };
                toastOk(`Status changed to ${statusLabels[s]}`);
              }}
              variant="desktop"
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        {status === 'invoiced' && (
          <div className="pointer-events-none absolute right-[-58px] top-8 z-20 rotate-45 bg-emerald-500 px-20 py-2 text-[14px] font-black uppercase tracking-widest text-white shadow-lg">
            PAID
          </div>
        )}
        {/* ── Stat cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 xl:grid-cols-2">
          <StatCard
            icon={FileText}
            label="Invoices"
            value={invoiceCount}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={CreditCard}
            label="Payments"
            value={paymentCount}
            color="bg-emerald-100 text-emerald-600"
          />
        </div>

        {/* ── Party + Internal info ────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Party Information */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
              Party Information
            </h2>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <div>
              <FieldLabel>Customer</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className={inputClass}
                  placeholder="Customer code"
                />
                <input
                  value={customerDisplay}
                  onChange={(e) => setCustomerDisplay(e.target.value)}
                  className={inputClass}
                  placeholder="Customer name"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Shipper</FieldLabel>
              <input
                value={shipper}
                onChange={(e) => setShipper(e.target.value)}
                className={inputClass}
                placeholder="Shipper"
              />
            </div>
            <div>
              <FieldLabel>Consignee</FieldLabel>
              <input
                value={consignee}
                onChange={(e) => setConsignee(e.target.value)}
                className={inputClass}
                placeholder="Consignee"
              />
            </div>
            <div>
              <FieldLabel>Salesman</FieldLabel>
              <input
                value={salesman}
                onChange={(e) => setSalesman(e.target.value)}
                className={inputClass}
                placeholder="Salesman"
              />
            </div>
            <div>
              <FieldLabel>Salesman Team</FieldLabel>
              <input
                value={salesmanTeam}
                onChange={(e) => setSalesmanTeam(e.target.value)}
                className={inputClass}
                placeholder="Salesman Team"
              />
            </div>
            <div>
              <FieldLabel>Sales Department</FieldLabel>
              <input
                value={salesDepartment}
                onChange={(e) => setSalesDepartment(e.target.value)}
                className={inputClass}
                placeholder="Sales Department"
              />
            </div>
          </div>
        </div>

        {/* Internal Information */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
              Internal Information
            </h2>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <div>
              <FieldLabel>Job</FieldLabel>
              <input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                className={inputClass}
                placeholder="Job number"
              />
            </div>
            <div>
              <FieldLabel>Master B/L</FieldLabel>
              <input
                value={masterBl}
                onChange={(e) => setMasterBl(e.target.value)}
                className={inputClass}
                placeholder="Master B/L"
              />
            </div>
            <div>
              <FieldLabel>House B/L</FieldLabel>
              <input
                value={houseBl}
                onChange={(e) => setHouseBl(e.target.value)}
                className={inputClass}
                placeholder="House B/L number"
              />
            </div>
            <div>
              <FieldLabel>Reference No</FieldLabel>
              <input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className={inputClass}
                placeholder="Reference no."
              />
            </div>
            <div>
              <FieldLabel>Created by</FieldLabel>
              <input
                value={createdBy}
                readOnly
                className={clsx(inputClass, 'bg-slate-50 cursor-default')}
                placeholder="—"
              />
            </div>
            <div>
              <FieldLabel>Created on</FieldLabel>
              <input
                value={createdOn}
                readOnly
                className={clsx(inputClass, 'bg-slate-50 cursor-default')}
                placeholder="—"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Accounting Information ────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
            Accounting Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <FieldLabel>Billing Date</FieldLabel>
            <input
              type="date"
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Due Date</FieldLabel>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Exchange Rate</FieldLabel>
            <div className="flex gap-2">
              <input
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className={clsx(inputClass, '!w-[120px]')}
                placeholder="26,320.00"
              />
              <div className="w-[150px]">
                <SearchableSelect
                  options={exchangeRateOptions.length > 0 ? exchangeRateOptions : [{ value: 'USD', label: 'VND/USD' }, { value: 'EUR', label: 'VND/EUR' }]}
                  value={exchangeCurrency}
                  onValueChange={handleCurrencyChange}
                  placeholder="VND/USD"
                  hideSearch
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Service Table ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-slate-50/80 px-5 py-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
            Service
          </h2>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/20"
          >
            <Plus size={13} />
            Add Line
          </button>
        </div>
        <div ref={tableWrapRef} className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-[12px]">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-8">
                  #
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[90px]">
                  Ser. Code
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[90px]">
                  Fare
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[100px]">
                  Fare Type
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[120px]">
                  Fare Name
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[100px]">
                  Tax
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[80px]">
                  Currency
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[90px]">
                  Exch. Rate
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide w-[80px]">
                  Unit
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[60px]">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[100px]">
                  Rate
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[110px]">
                  Amt (foreign)
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[110px]">
                  Local Amt
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[100px]">
                  VAT (foreign)
                </th>
                <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide w-[100px]">
                  VAT (local)
                </th>
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr
                  key={line.id}
                  className="border-b border-border/50 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-3 py-1.5 text-slate-400 font-semibold">
                    {idx + 1}
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      value={line.service_code}
                      onChange={(e) =>
                        updateLine(line.id, { service_code: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="VNCLI-BD"
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      value={line.fare}
                      onChange={(e) =>
                        updateLine(line.id, { fare: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="Freight"
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <SearchableSelect
                      options={FARE_TYPES}
                      value={line.fare_type || undefined}
                      onValueChange={(v) =>
                        updateLine(line.id, { fare_type: v })
                      }
                      placeholder="Type"
                      hideSearch
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      value={line.fare_name}
                      onChange={(e) =>
                        updateLine(line.id, { fare_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="Fare name"
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <SearchableSelect
                      options={TAX_OPTIONS}
                      value={line.tax || undefined}
                      onValueChange={(v) => updateLine(line.id, { tax: v })}
                      placeholder="Tax"
                      hideSearch
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <SearchableSelect
                      options={CURRENCIES}
                      value={line.currency || undefined}
                      onValueChange={(v) =>
                        updateLine(line.id, { currency: v })
                      }
                      placeholder="Curr"
                      hideSearch
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="number"
                      value={line.exchange_rate}
                      onChange={(e) =>
                        updateLine(line.id, {
                          exchange_rate: Number(e.target.value) || 1,
                        })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium text-right outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      value={line.unit}
                      onChange={(e) =>
                        updateLine(line.id, { unit: e.target.value })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium outline-none focus:ring-1 focus:ring-primary/30"
                      placeholder="Container"
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="number"
                      value={line.qty}
                      onChange={(e) =>
                        updateLine(line.id, {
                          qty: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium text-right outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="number"
                      value={line.rate}
                      onChange={(e) =>
                        updateLine(line.id, {
                          rate: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-[12px] font-medium text-right outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold text-slate-700 tabular-nums">
                    {fmtNumber(line.amount_foreign)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold text-slate-700 tabular-nums">
                    {fmtNumber(line.local_amount)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-500 tabular-nums">
                    {fmtNumber(line.vat_foreign)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-500 tabular-nums">
                    {fmtNumber(line.vat_local)}
                  </td>
                  <td className="px-1.5 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Remark ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
            Remark
          </h2>
        </div>
        <div className="p-5">
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            className={clsx(inputClass, 'resize-none')}
            placeholder="Additional remarks..."
          />
        </div>
      </div>

      {/* ── Total + Payment ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TOTAL */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
              Total
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">
                Untaxed Amount
              </span>
              <span className="text-[15px] font-bold text-slate-900 tabular-nums">
                {fmtCurrency(untaxedAmount, 'VND')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">
                Taxed Amount
              </span>
              <span className="text-[15px] font-bold text-slate-900 tabular-nums">
                {fmtCurrency(taxedAmount, 'VND')}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-[14px] font-bold text-slate-900">
                Grand Total
              </span>
              <span className="text-[18px] font-black text-primary tabular-nums">
                {fmtCurrency(totalAmount, 'VND')}
              </span>
            </div>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
              Payment
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">
                Paid Amount
              </span>
              <span className="text-[15px] font-bold text-emerald-600 tabular-nums">
                {fmtCurrency(paidAmount, 'VND')}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-[14px] font-bold text-slate-900">
                Residual Amount
              </span>
              <span
                className={clsx(
                  'text-[18px] font-black tabular-nums',
                  residualAmount > 0 ? 'text-amber-600' : 'text-emerald-600',
                )}
              >
                {fmtCurrency(residualAmount, 'VND')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bank ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">
            Bank
          </h2>
        </div>
        <div className="p-5">
          <textarea
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            rows={2}
            className={clsx(inputClass, 'resize-none')}
            placeholder="Bank account details..."
          />
        </div>
      </div>
    </div>
  );
};

export default DebitNotePage;
