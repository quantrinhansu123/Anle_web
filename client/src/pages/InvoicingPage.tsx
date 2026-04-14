import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookCheck, ChevronLeft, FileText, HelpCircle, Trash2, Wallet, X, Send } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { DateInput } from '../components/ui/DateInput';
import { WorkflowStepper, type WorkflowStep } from '../components/ui/WorkflowStepper';
import { useBreadcrumb } from '../contexts/BreadcrumbContext';
import { useToastContext } from '../contexts/ToastContext';
import { fmsJobInvoiceService } from '../services/fmsJobInvoiceService';

type InvoiceLine = {
  id: string;
  product: string;
  description: string;
  account: string;
  quantity: number;
  unit: string;
  price: number;
  tax: string;
};

type InvoiceTab = 'invoice_lines' | 'journal_entries' | 'vn_einvoice' | 'other_info' | 'matched_entry' | 'hr_metrics';

const inputClass =
  'w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-colors';

const labelClass = 'text-[11px] font-bold text-muted-foreground uppercase tracking-tight block mb-1';

let lineCounter = 0;
const nextLineId = () => `inv-line-${++lineCounter}`;

const emptyLine = (): InvoiceLine => ({
  id: nextLineId(),
  product: '',
  description: '',
  account: '5113 Service Revenue',
  quantity: 1,
  unit: '',
  price: 0,
  tax: 'VAT 10%',
});

type InvoiceStatus = 'draft' | 'posted';

const INVOICE_STATUS_STEPS: WorkflowStep<InvoiceStatus>[] = [
  { id: 'draft', label: 'Draft', icon: FileText },
  { id: 'posted', label: 'Posted', icon: BookCheck },
];

const JOURNAL_OPTIONS = [
  { value: 'BE1654647687654', label: 'BE1654647687654' },
  { value: 'Customer Invoices', label: 'Customer Invoices' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
];

function FieldLabelWithHint({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1 inline-flex items-center gap-1">
      <span className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">{children}</span>
      {hint ? (
        <span className="inline-flex shrink-0 text-muted-foreground/70" title={hint}>
          <HelpCircle size={12} aria-hidden />
        </span>
      ) : null}
    </div>
  );
}

const InvoicingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setCustomBreadcrumbs } = useBreadcrumb();
  const { success: toastOk, error: toastErr } = useToastContext();
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [activeTab, setActiveTab] = useState<InvoiceTab>('invoice_lines');
  const invoiceDraft = (location.state as {
    invoiceDraft?: {
      fromPaymentNote?: boolean;
      fromDebitNoteNo?: string;
      customer?: string;
      description?: string;
      invoiceDate?: string;
      dueDate?: string;
      exchangeRate?: string;
      journal?: string;
      lines?: InvoiceLine[];
    };
  } | null)?.invoiceDraft;

  const [invoiceNo, setInvoiceNo] = useState(() => {
    const dnNo = invoiceDraft?.fromDebitNoteNo || '';
    return dnNo ? dnNo.replace(/^DN-/i, 'INV-') : '';
  });
  const [customer, setCustomer] = useState(invoiceDraft?.customer || 'NEO FOODTECH');
  const [description, setDescription] = useState(invoiceDraft?.description || '');
  const [invoiceDate, setInvoiceDate] = useState(invoiceDraft?.invoiceDate || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(invoiceDraft?.dueDate || new Date().toISOString().slice(0, 10));
  const [taxNo, setTaxNo] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('/');
  const [journal, setJournal] = useState(invoiceDraft?.journal || 'Customer Invoices');
  const [manualRate, setManualRate] = useState(false);
  const [currencyRate, setCurrencyRate] = useState(invoiceDraft?.exchangeRate || '1');
  const [eInvoiceProvider, setEInvoiceProvider] = useState('Bkav Ehoadon');
  const [eInvoiceSerial, setEInvoiceSerial] = useState('C25TYY');
  const [eInvoiceStatus, setEInvoiceStatus] = useState('Not Generated');
  const [lines, setLines] = useState<InvoiceLine[]>(
    invoiceDraft?.lines && invoiceDraft.lines.length > 0
      ? invoiceDraft.lines.map((line) => ({ ...line, id: nextLineId() }))
      : [emptyLine(), emptyLine()],
  );

  const fromDnNo = searchParams.get('dnNo');
  const fromDnId = searchParams.get('dnId');
  const fromPnId = searchParams.get('pnId');
  const fromJobId = searchParams.get('jobId');
  const fromJobNo = searchParams.get('jobNo');
  const invoiceId = searchParams.get('invoiceId');

  const [billFromPaymentNote, setBillFromPaymentNote] = useState(
    () => Boolean(invoiceDraft?.fromPaymentNote) || Boolean(fromPnId),
  );

  const [invoiceHydrating, setInvoiceHydrating] = useState(() => Boolean(invoiceId && searchParams.get('jobId')));

  const untaxed = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.price || 0), 0),
    [lines],
  );
  const taxAmount = useMemo(() => untaxed * 0.1, [untaxed]);
  const grandTotal = untaxed + taxAmount;
  const customerUpper = (customer || '').trim().toUpperCase() || 'CUSTOMER';

  const journalRows = useMemo(() => {
    const revenueRows = lines.map((line) => {
      const amount = Number(line.quantity || 0) * Number(line.price || 0);
      return {
        id: `rev-${line.id}`,
        product: line.product || '—',
        account: line.account || '5113 Service Revenue',
        partner: customerUpper,
        label: line.description || 'Service line',
        debit: 0,
        credit: amount,
      };
    });

    const vatRows = lines
      .map((line) => {
        const amount = Number(line.quantity || 0) * Number(line.price || 0);
        const vatRate = line.tax === 'VAT 8%' ? 0.08 : line.tax === 'VAT 10%' ? 0.1 : 0;
        const vat = amount * vatRate;
        return {
          id: `vat-${line.id}`,
          product: '',
          account: '33311 VAT Output Tax',
          partner: customerUpper,
          label: line.tax === 'VAT 8%' ? 'Value Added Tax (VAT) 8%' : line.tax === 'VAT 10%' ? 'Value Added Tax (VAT) 10%' : 'Tax Exempt',
          debit: 0,
          credit: vat,
        };
      })
      .filter((row) => row.credit > 0);

    return [...revenueRows, ...vatRows];
  }, [lines, customerUpper]);

  const updateLine = (id: string, patch: Partial<InvoiceLine>) => {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== id)));

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentJournal, setPaymentJournal] = useState('BE1654647687654');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const openRecordPayment = () => {
    setPaymentJournal('BE1654647687654');
    setPaymentMethod('manual');
    setPaymentAmount(String(Math.round(grandTotal)));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMemo(invoiceNo.trim() || 'INV/2026/00023');
    setRecordPaymentOpen(true);
  };

  const closeRecordPayment = () => setRecordPaymentOpen(false);

  const handleRevertToDraft = async () => {
    if (fromJobId && invoiceId) {
      try {
        await fmsJobInvoiceService.update(fromJobId, invoiceId, {
          status: 'draft',
          payment_status: 'unpaid',
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Could not reset invoice';
        toastErr(msg);
        return;
      }
    }
    setStatus('draft');
    setIsPaid(false);
  };

  const handleCreatePayment = async () => {
    if (!fromJobId || !invoiceId) {
      setIsPaid(true);
      toastOk('Payment recorded (local only — open this invoice from a job to sync).');
      setRecordPaymentOpen(false);
      return;
    }
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toastErr('Enter a valid payment amount');
      return;
    }
    try {
      const { invoice: inv } = await fmsJobInvoiceService.recordPayment(fromJobId, invoiceId, {
        journal: paymentJournal || null,
        payment_method: paymentMethod || null,
        amount,
        payment_date: paymentDate || null,
        memo: paymentMemo || null,
      });
      setIsPaid(inv.payment_status === 'paid');
      toastOk('Payment recorded successfully');
      setRecordPaymentOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed';
      toastErr(msg);
    }
  };

  const handleInvoiceStatusStep = async (next: InvoiceStatus) => {
    if (next === status) return;
    if (!fromJobId || !invoiceId) {
      setStatus(next);
      return;
    }
    try {
      await fmsJobInvoiceService.update(fromJobId, invoiceId, {
        status: next,
        grand_total: grandTotal,
        lines: lines.map(({ id: _id, ...rest }) => rest),
        payload: {
          customer,
          description,
          invoice_date: invoiceDate,
          due_date: dueDate,
          exchange_rate: currencyRate,
          journal,
        },
      });
      setStatus(next);
      toastOk(next === 'posted' ? 'Invoice posted' : 'Invoice saved as draft');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not update invoice';
      toastErr(msg);
    }
  };

  const handleConfirmPost = async () => {
    await handleInvoiceStatusStep('posted');
  };

  useEffect(() => {
    if (!fromJobId) {
      setCustomBreadcrumbs(null);
      return;
    }

    const debitNoteLabel = fromDnNo || 'Debit Note';
    const debitNotePath = fromDnId
      ? `/shipping/jobs/${fromJobId}/sea-house-bl/debit-note/${fromDnId}`
      : `/shipping/jobs/${fromJobId}/sea-house-bl/debit-note`;
    setCustomBreadcrumbs([
      { path: '/shipping', label: 'Shipping' },
      { path: '/shipping/jobs', label: 'Job Management' },
      {
        path: `/shipping/jobs/${fromJobId}/edit`,
        label: fromJobNo || `Job ${fromJobId.slice(0, 8)}...`,
      },
      { path: `/shipping/jobs/${fromJobId}/sea-house-bl`, label: 'Sea House B/L' },
      { path: debitNotePath, label: debitNoteLabel },
      {
        path: `/financials/invoicing${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        label: 'Invoicing',
      },
    ]);

    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [fromDnId, fromDnNo, fromJobId, fromJobNo, searchParams, setCustomBreadcrumbs]);

  useEffect(() => {
    if (!fromJobId || !invoiceId) {
      setInvoiceHydrating(false);
      return;
    }
    let cancelled = false;
    setInvoiceHydrating(true);
    void (async () => {
      try {
        const inv = await fmsJobInvoiceService.get(fromJobId, invoiceId);
        if (cancelled) return;
        setInvoiceNo(inv.invoice_no);
        if (/^BILL\//i.test(String(inv.invoice_no || ''))) {
          setBillFromPaymentNote(true);
        }
        setStatus(inv.status);
        setIsPaid(inv.payment_status === 'paid');
        const pl = (inv.payload || {}) as Record<string, unknown>;
        if (typeof pl.customer === 'string') setCustomer(pl.customer);
        if (typeof pl.description === 'string') setDescription(pl.description);
        if (typeof pl.invoice_date === 'string') setInvoiceDate(pl.invoice_date);
        if (typeof pl.due_date === 'string') setDueDate(pl.due_date);
        if (typeof pl.exchange_rate === 'string') setCurrencyRate(pl.exchange_rate);
        if (typeof pl.journal === 'string') setJournal(pl.journal);

        const rawLines = inv.lines;
        if (Array.isArray(rawLines) && rawLines.length > 0) {
          setLines(
            rawLines.map((l) => {
              const row = l as Record<string, unknown>;
              return {
                id: typeof row.id === 'string' ? row.id : nextLineId(),
                product: String(row.product ?? ''),
                description: String(row.description ?? ''),
                account: String(row.account ?? '5113 Service Revenue'),
                quantity: Number(row.quantity ?? 0),
                unit: String(row.unit ?? ''),
                price: Number(row.price ?? 0),
                tax: String(row.tax ?? 'VAT 10%'),
              };
            }),
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load invoice';
        toastErr(msg);
      } finally {
        if (!cancelled) setInvoiceHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromJobId, invoiceId, toastErr]);

  return (
    <div className="animate-in fade-in duration-300 mx-auto flex w-full flex-col gap-4 px-0 pb-16 sm:px-1 md:pb-6">
      <div className="relative rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 rounded-2xl bg-linear-to-br from-white via-white to-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary touch-manipulation"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0">
              <p className="mb-0.5 text-[10px] font-bold uppercase leading-none tracking-wider text-primary">
                Invoice No.
              </p>
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full border-none bg-transparent text-2xl font-black tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
                placeholder="INV/2026/00023"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto lg:shrink-0">
            {status === 'draft' && (
              <button
                type="button"
                onClick={() => void handleConfirmPost()}
                disabled={invoiceHydrating}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Send size={14} />
                Confirm
              </button>
            )}
            <WorkflowStepper
              steps={INVOICE_STATUS_STEPS}
              currentStep={status}
              onStepChange={(s) => void handleInvoiceStatusStep(s as InvoiceStatus)}
              variant="desktop"
            />
          </div>
        </div>

        {status === 'posted' && (
          <>
            <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-4 py-2">
              <div className="inline-flex flex-wrap items-center gap-1.5">
                {billFromPaymentNote ? (
                  <>
                    <button
                      type="button"
                      onClick={openRecordPayment}
                      className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold tracking-wide text-white"
                    >
                      Register Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => toastOk('This feature is not available yet.')}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-600"
                    >
                      Add Credit Advice
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRevertToDraft()}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-600"
                    >
                      Reset to Draft
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Create E-Invoice</button>
                    <button type="button" className="rounded-md border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Send & Print</button>
                    <button
                      type="button"
                      onClick={openRecordPayment}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                    >
                      Record Payment
                    </button>
                    <button type="button" className="rounded-md border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Preview</button>
                    <button type="button" className="rounded-md border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Add Credit Note</button>
                    <button
                      type="button"
                      onClick={() => void handleRevertToDraft()}
                      className="rounded-md border border-border bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
                    >
                      Reset to Draft
                    </button>
                  </>
                )}
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                {isPaid ? 'Paid' : 'Posted'}
              </span>
            </div>
          </>
        )}

        <div className="relative z-20 p-4 sm:p-5">
          {invoiceHydrating && (
            <p className="mb-3 text-[12px] font-medium text-muted-foreground">Loading invoice…</p>
          )}
          {status === 'posted' && isPaid && (
            <div className="pointer-events-none absolute right-[-66px] top-8 z-10 rotate-45 bg-emerald-500 px-20 py-2 text-[14px] font-black uppercase tracking-widest text-white shadow-lg">
              Paid
            </div>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground">Customer Invoice</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  {status === 'posted' ? 'Posted' : 'Draft'}
                </h1>
                {fromDnNo && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    From DN {fromDnNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Invoice Number</label>
                <input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className={inputClass}
                  placeholder="INV000001"
                />
              </div>
              <div>
                <label className={labelClass}>Customer</label>
                <input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={clsx(inputClass, 'resize-none')}
                  placeholder="Invoice description..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Invoice Date</label>
                <DateInput value={invoiceDate} onChange={setInvoiceDate} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>Tax No</label>
                <input value={taxNo} onChange={(e) => setTaxNo(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Payment Terms</label>
                <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Due Date</label>
                <DateInput value={dueDate} onChange={setDueDate} className="w-full" />
              </div>
              <div>
                <label className={labelClass}>Journal</label>
                <input value={journal} onChange={(e) => setJournal(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Use Manual Exchange Rate</label>
                <div className="flex h-[38px] items-center rounded-xl border border-border bg-muted/10 px-3">
                  <input
                    type="checkbox"
                    checked={manualRate}
                    onChange={(e) => setManualRate(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Current Exchange Rate</label>
                <input value={currencyRate} onChange={(e) => setCurrencyRate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>E-invoice Provider</label>
                <input value={eInvoiceProvider} onChange={(e) => setEInvoiceProvider(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>E-invoice Serial</label>
                <input value={eInvoiceSerial} onChange={(e) => setEInvoiceSerial(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>E-invoice Status</label>
                <input value={eInvoiceStatus} onChange={(e) => setEInvoiceStatus(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-40 border-t border-border bg-white px-4 pt-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <button type="button" onClick={() => setActiveTab('invoice_lines')} className={clsx('rounded-lg px-2.5 py-1', activeTab === 'invoice_lines' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100')}>Invoice Lines</button>
            <button type="button" onClick={() => setActiveTab('journal_entries')} className={clsx('rounded-lg px-2.5 py-1', activeTab === 'journal_entries' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100')}>Journal Entries</button>
            <button type="button" onClick={() => setActiveTab('vn_einvoice')} className={clsx('rounded-lg px-2.5 py-1', activeTab === 'vn_einvoice' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100')}>VN E-invoice</button>
            <button type="button" onClick={() => setActiveTab('other_info')} className={clsx('rounded-lg px-2.5 py-1', activeTab === 'other_info' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100')}>Other Info</button>
            <button type="button" onClick={() => setActiveTab('matched_entry')} className={clsx('rounded-lg px-2.5 py-1', activeTab === 'matched_entry' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100')}>Matched Entry Mapping</button>
            <button type="button" onClick={() => setActiveTab('hr_metrics')} className={clsx('rounded-lg px-2.5 py-1', activeTab === 'hr_metrics' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100')}>HR Metrics</button>
          </div>

          {activeTab === 'invoice_lines' ? (
            <div className="mt-3 overflow-x-auto border border-border">
              <table className="w-full min-w-[980px] text-[12px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Product</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Label</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Account</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-muted-foreground">Quantity</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Unit</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-muted-foreground">Price</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Tax</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-b border-border/70 last:border-0">
                      <td className="px-2 py-1.5">
                        <input value={line.product} onChange={(e) => updateLine(line.id, { product: e.target.value })} className={clsx(inputClass, 'rounded-lg py-1.5')} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} className={clsx(inputClass, 'rounded-lg py-1.5')} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={line.account} onChange={(e) => updateLine(line.id, { account: e.target.value })} className={clsx(inputClass, 'rounded-lg py-1.5')} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) || 0 })} className={clsx(inputClass, 'rounded-lg py-1.5 text-right')} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value })} className={clsx(inputClass, 'rounded-lg py-1.5')} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={line.price} onChange={(e) => updateLine(line.id, { price: Number(e.target.value) || 0 })} className={clsx(inputClass, 'rounded-lg py-1.5 text-right')} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={line.tax} onChange={(e) => updateLine(line.id, { tax: e.target.value })} className={clsx(inputClass, 'rounded-lg py-1.5')} />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 1}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-30"
                          aria-label="Remove line"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'journal_entries' ? (
            <div className="mt-3 overflow-x-auto border border-border">
              <table className="w-full min-w-[1120px] text-[12px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Product</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Account</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Partner</th>
                    <th className="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">Label</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-muted-foreground">Debit</th>
                    <th className="px-3 py-2 text-right font-bold uppercase tracking-wide text-muted-foreground">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {journalRows.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 last:border-0">
                      <td className="px-3 py-2 font-medium text-slate-700">{row.product || '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{row.account}</td>
                      <td className="px-3 py-2 font-semibold text-slate-600">{row.partner}</td>
                      <td className="px-3 py-2 text-slate-600">{row.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                        {row.debit > 0 ? `${new Intl.NumberFormat('en-US').format(row.debit)} VND` : '0 VND'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">
                        {row.credit > 0 ? `${new Intl.NumberFormat('en-US').format(row.credit)} VND` : '0 VND'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-[12px] font-medium text-muted-foreground">
              This tab content will be implemented next.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="inline-flex items-center gap-3 text-[12px]">
              <button type="button" onClick={addLine} className="font-bold text-primary hover:text-primary/80" disabled={activeTab !== 'invoice_lines'}>
                Add Line
              </button>
              <button type="button" className="font-bold text-slate-500 hover:text-slate-700" disabled={activeTab !== 'invoice_lines'}>
                Add Section
              </button>
              <button type="button" className="font-bold text-slate-500 hover:text-slate-700" disabled={activeTab !== 'invoice_lines'}>
                Add Note
              </button>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-muted-foreground">Untaxed: {new Intl.NumberFormat('en-US').format(untaxed)}</p>
              <p className="text-[11px] font-medium text-muted-foreground">Tax: {new Intl.NumberFormat('en-US').format(taxAmount)}</p>
              <p className={clsx('text-[14px] font-black', status === 'draft' ? 'text-primary' : 'text-emerald-600')}>
                Total: {new Intl.NumberFormat('en-US').format(grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {recordPaymentOpen &&
        createPortal(
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={closeRecordPayment}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="record-payment-title"
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wallet size={18} />
                  </div>
                  <h2 id="record-payment-title" className="text-[16px] font-bold text-slate-900">
                    Record Payment
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeRecordPayment}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <div>
                  <FieldLabelWithHint hint="Journal used for this payment entry">Journal</FieldLabelWithHint>
                  <select
                    value={paymentJournal}
                    onChange={(e) => setPaymentJournal(e.target.value)}
                    className={inputClass}
                  >
                    {JOURNAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabelWithHint hint="Total amount to allocate">Total amount</FieldLabelWithHint>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className={clsx(inputClass, 'min-w-0 flex-1')}
                      min={0}
                    />
                    <span className="inline-flex shrink-0 items-center rounded-xl border border-border bg-muted/20 px-3 text-[12px] font-bold text-slate-600">
                      VND
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {paymentAmount
                      ? `VND ${new Intl.NumberFormat('en-US').format(Number(paymentAmount) || 0)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <FieldLabelWithHint hint="How the payment was received">Payment method</FieldLabelWithHint>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={inputClass}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabelWithHint hint="Date the payment was received">Payment date</FieldLabelWithHint>
                  <DateInput value={paymentDate} onChange={setPaymentDate} className="w-full" />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabelWithHint hint="Bank account receiving the funds">Recipient bank account</FieldLabelWithHint>
                  <div className={clsx(inputClass, 'cursor-default bg-slate-50 text-slate-700')}>
                    BE1654647687654 — BNP Paribas
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabelWithHint hint="Shown on bank statement / reconciliation">Transaction memo</FieldLabelWithHint>
                  <input
                    value={paymentMemo}
                    onChange={(e) => setPaymentMemo(e.target.value)}
                    className={inputClass}
                    placeholder="INV/2026/00023"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  onClick={() => void handleCreatePayment()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  Create payment
                </button>
                <button
                  type="button"
                  onClick={closeRecordPayment}
                  className="rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-200/60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default InvoicingPage;
