import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, CreditCard, FileText, Receipt, Send, Wallet, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { WorkflowStepper } from '../../components/ui/WorkflowStepper';
import { DateInput } from '../../components/ui/DateInput';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useToastContext } from '../../contexts/ToastContext';
import { jobService } from '../../services/jobService';
import { FieldLabel, inputClass } from './tabs/blSharedHelpers';
import { fmsJobPaymentNoteService } from '../../services/fmsJobPaymentNoteService';
import { fmsJobDebitNoteService } from '../../services/fmsJobDebitNoteService';
import { fmsJobInvoiceService } from '../../services/fmsJobInvoiceService';

type PaymentNoteStatus = 'draft' | 'approved' | 'partial_billed' | 'billed' | 'cancel';

type PaymentLine = {
  id: string;
  vendor: string;
  service: string;
  fare: string;
  fareType: string;
  fareName: string;
  tax: string;
  currency: string;
  exchangeRate: number;
  unit: string;
  qty: number;
  rate: number;
};

let _lineId = 0;
const nextLineId = () => `pn-line-${++_lineId}`;

const emptyLine = (): PaymentLine => ({
  id: nextLineId(),
  vendor: '',
  service: '',
  fare: '',
  fareType: '',
  fareName: '',
  tax: '',
  currency: 'VND',
  exchangeRate: 1,
  unit: '',
  qty: 1,
  rate: 0,
});

function lineToDto(line: PaymentLine, sortOrder: number) {
  return {
    sort_order: sortOrder,
    vendor: line.vendor || null,
    service: line.service || null,
    fare: line.fare || null,
    fare_type: line.fareType || null,
    fare_name: line.fareName || null,
    tax: line.tax || null,
    currency: line.currency || null,
    exchange_rate: line.exchangeRate,
    unit: line.unit || null,
    qty: line.qty,
    rate: line.rate,
  };
}

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
      <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-black tracking-tight text-slate-900 leading-tight">{value}</p>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

const PaymentNotePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: jobId, pnId } = useParams<{ id: string; pnId?: string }>();
  const { setCustomBreadcrumbs } = useBreadcrumb();
  const { success: toastOk, error: toastErr } = useToastContext();

  const [jobNo, setJobNo] = useState('');
  const [masterBl, setMasterBl] = useState('');
  const [masterJobLabel, setMasterJobLabel] = useState('');

  const [paymentNo, setPaymentNo] = useState('');
  const [status, setStatus] = useState<PaymentNoteStatus>('draft');
  const [creatingBill, setCreatingBill] = useState(false);
  const [persistedPnId, setPersistedPnId] = useState<string | undefined>(pnId);

  const [vendorCode, setVendorCode] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [payer, setPayer] = useState('');
  const [shipper, setShipper] = useState('');
  const [consignee, setConsignee] = useState('');
  const [payFor, setPayFor] = useState('');
  const [pic, setPic] = useState('');
  const [email, setEmail] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const [performanceDate, setPerformanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [houseBl, setHouseBl] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [billingDate, setBillingDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [exchangeRate, setExchangeRate] = useState('');

  const [lines, setLines] = useState<PaymentLine[]>([emptyLine()]);
  const pnHydratedRef = useRef(false);
  const skipAutosaveRef = useRef(true);
  const [autosaveEpoch, setAutosaveEpoch] = useState(0);

  useEffect(() => {
    setPersistedPnId(pnId);
  }, [pnId]);

  useEffect(() => {
    if (!jobId) return;
    pnHydratedRef.current = false;
    skipAutosaveRef.current = true;
    void (async () => {
      try {
        const job = await jobService.getJob(jobId);
        setJobNo(job.master_job_no || '');
        setMasterBl(job.master_bl_number || '');
        setMasterJobLabel(job.master_job_no || '');

        if (pnId) {
          const note = await fmsJobPaymentNoteService.get(jobId, pnId);
          setPaymentNo(note.no_doc);
          setStatus((note.status as PaymentNoteStatus) || 'draft');
          const p = note.payload || {};
          if (typeof p.vendorCode === 'string') setVendorCode(p.vendorCode);
          if (typeof p.vendorName === 'string') setVendorName(p.vendorName);
          if (typeof p.payer === 'string') setPayer(p.payer);
          if (typeof p.shipper === 'string') setShipper(p.shipper);
          if (typeof p.consignee === 'string') setConsignee(p.consignee);
          if (typeof p.payFor === 'string') setPayFor(p.payFor);
          if (typeof p.pic === 'string') setPic(p.pic);
          if (typeof p.email === 'string') setEmail(p.email);
          if (typeof p.vendorInvoiceNo === 'string') setVendorInvoiceNo(p.vendorInvoiceNo);
          if (typeof p.paymentType === 'string') setPaymentType(p.paymentType);
          if (typeof p.isPaid === 'boolean') setIsPaid(p.isPaid);
          if (typeof p.performanceDate === 'string') setPerformanceDate(p.performanceDate);
          if (typeof p.houseBl === 'string') setHouseBl(p.houseBl);
          if (typeof p.referenceNo === 'string') setReferenceNo(p.referenceNo);
          if (typeof p.billingDate === 'string') setBillingDate(p.billingDate);
          if (typeof p.dueDate === 'string') setDueDate(p.dueDate);
          if (typeof p.exchangeRate === 'string') setExchangeRate(p.exchangeRate);
          if (note.lines && note.lines.length > 0) {
            const mapped = [...note.lines]
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((l) => ({
                id: l.id,
                vendor: l.vendor ?? '',
                service: l.service ?? '',
                fare: l.fare ?? '',
                fareType: l.fare_type ?? '',
                fareName: l.fare_name ?? '',
                tax: l.tax ?? '',
                currency: l.currency ?? 'VND',
                exchangeRate: Number(l.exchange_rate ?? 1),
                unit: l.unit ?? '',
                qty: Number(l.qty ?? 1),
                rate: Number(l.rate ?? 0),
              }));
            setLines(mapped);
          }
        } else {
          const ts = Date.now().toString(36).toUpperCase();
          setPaymentNo(`SOTAHCN-${ts}`);
        }
      } catch {
        /* ignore */
      } finally {
        pnHydratedRef.current = true;
        window.setTimeout(() => {
          skipAutosaveRef.current = false;
          setAutosaveEpoch((n) => n + 1);
        }, 500);
      }
    })();
  }, [jobId, pnId]);

  useEffect(() => {
    const jobLabel = masterJobLabel || (jobId ? `Job ${jobId.slice(0, 8)}...` : 'New Job');
    setCustomBreadcrumbs([
      { path: '/shipping', label: 'Shipping' },
      { path: '/shipping/jobs', label: 'Job Management' },
      ...(jobId ? [{ path: `/shipping/jobs/${jobId}/edit`, label: jobLabel }] : []),
      { path: `/shipping/jobs/${jobId || 'new'}/sea-house-bl`, label: 'Sea House B/L' },
      {
        path: pnId
          ? `/shipping/jobs/${jobId || 'new'}/sea-house-bl/payment-note/${pnId}`
          : `/shipping/jobs/${jobId || 'new'}/sea-house-bl/payment-note`,
        label: paymentNo || 'Payment Note',
      },
    ]);
    return () => setCustomBreadcrumbs(null);
  }, [jobId, masterJobLabel, paymentNo, pnId, setCustomBreadcrumbs]);

  const updateLine = (id: string, patch: Partial<PaymentLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const totalBills = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.rate || 0), 0),
    [lines],
  );

  const persistPayload = useMemo(
    () => ({
      vendorCode,
      vendorName,
      payer,
      shipper,
      consignee,
      payFor,
      pic,
      email,
      vendorInvoiceNo,
      paymentType,
      isPaid,
      performanceDate,
      houseBl,
      referenceNo,
      billingDate,
      dueDate,
      exchangeRate,
    }),
    [
      vendorCode,
      vendorName,
      payer,
      shipper,
      consignee,
      payFor,
      pic,
      email,
      vendorInvoiceNo,
      paymentType,
      isPaid,
      performanceDate,
      houseBl,
      referenceNo,
      billingDate,
      dueDate,
      exchangeRate,
    ],
  );

  const persistSnapshot = useMemo(
    () => JSON.stringify({ paymentNo, status, persistPayload, lines }),
    [paymentNo, status, persistPayload, lines],
  );

  useEffect(() => {
    if (!jobId || !pnHydratedRef.current || skipAutosaveRef.current) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          if (persistedPnId) {
            await fmsJobPaymentNoteService.update(jobId, persistedPnId, {
              no_doc: paymentNo,
              status,
              payload: persistPayload,
              lines: lines.map((line, idx) => lineToDto(line, idx)),
            });
            return;
          }
          const created = await fmsJobPaymentNoteService.create(jobId, {
            no_doc: paymentNo || `SOTAHCN-${Date.now().toString(36).toUpperCase()}`,
            status,
            payload: persistPayload,
            lines: lines.map((line, idx) => lineToDto(line, idx)),
          });
          setPersistedPnId(created.id);
          navigate(`/shipping/jobs/${jobId}/sea-house-bl/payment-note/${created.id}`, { replace: true });
        } catch {
          toastErr('Autosave failed');
        }
      })();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [autosaveEpoch, jobId, persistedPnId, persistSnapshot, paymentNo, status, persistPayload, lines, toastErr, navigate]);

  const handleCreateBill = useCallback(async () => {
    if (!jobId) return;
    setCreatingBill(true);
    try {
      let realPnId = persistedPnId;
      if (!realPnId) {
        const created = await fmsJobPaymentNoteService.create(jobId, {
          no_doc: paymentNo || `SOTAHCN-${Date.now().toString(36).toUpperCase()}`,
          status,
          payload: persistPayload,
          lines: lines.map((line, idx) => lineToDto(line, idx)),
        });
        realPnId = created.id;
        setPersistedPnId(created.id);
      } else {
        await fmsJobPaymentNoteService.update(jobId, realPnId, {
          no_doc: paymentNo,
          status,
          payload: persistPayload,
          lines: lines.map((line, idx) => lineToDto(line, idx)),
        });
      }

      const params = new URLSearchParams();
      params.set('jobId', jobId);
      if (jobNo) params.set('jobNo', jobNo);
      params.set('pnId', realPnId);
      params.set('pnNo', paymentNo);

      const dnNo = paymentNo.startsWith('DN-') ? paymentNo : `DN-${paymentNo}`;
      const dnPayload: Record<string, unknown> = {
        customer: vendorName || payer || '',
        customer_display: vendorName || payer || '',
        shipper,
        consignee,
        billing_date: billingDate,
        due_date: dueDate,
        exchange_rate: exchangeRate || '1',
        reference_no: referenceNo,
        remark: `Generated from payment note ${paymentNo}`,
      };
      const dn = await fmsJobDebitNoteService.create(jobId, {
        no_doc: dnNo,
        status: 'sent',
        payload: dnPayload,
        lines: lines.map((line, idx) => ({
          sort_order: idx,
          service_code: line.service || null,
          fare: line.fare || null,
          fare_type: line.fareType || null,
          fare_name: line.fareName || null,
          tax: line.tax || null,
          currency: line.currency || null,
          exchange_rate: line.exchangeRate,
          unit: line.unit || null,
          qty: line.qty,
          rate: line.rate,
        })),
      });

      const invoiceLines = lines.map((line) => ({
        product: line.service || line.fare,
        description: line.fareName || line.fare || line.service,
        account: '5113 Service Revenue',
        quantity: Number(line.qty || 0),
        unit: line.unit,
        price: Number(line.rate || 0),
        tax: line.tax === 'vat_8' ? 'VAT 8%' : line.tax === 'vat_10' ? 'VAT 10%' : 'None',
      }));
      const inv = await fmsJobInvoiceService.create(jobId, {
        debit_note_id: dn.id,
        number_series: 'BILL',
        status: 'draft',
        grand_total: totalBills,
        lines: invoiceLines,
        payload: {
          customer: vendorName || payer || '',
          description: `Bill from payment note ${paymentNo}`,
          invoice_date: billingDate,
          due_date: dueDate,
          exchange_rate: exchangeRate || '1',
          journal: 'Customer Invoices',
        },
      });

      params.set('dnId', dn.id);
      params.set('dnNo', dn.no_doc);
      params.set('invoiceId', inv.id);

      const invoiceDraft = {
        fromPaymentNote: true as const,
        fromDebitNoteNo: dn.no_doc,
        fromDebitNoteId: dn.id,
        customer: vendorName || payer || '',
        description: `Bill from payment note ${paymentNo}`,
        invoiceDate: billingDate,
        dueDate,
        exchangeRate: exchangeRate || '1',
        journal: 'Customer Invoices',
        lines: lines.map((line) => ({
          id: nextLineId(),
          product: line.service || line.fare,
          description: line.fareName || line.fare || line.service,
          account: '5113 Service Revenue',
          quantity: Number(line.qty || 0),
          unit: line.unit,
          price: Number(line.rate || 0),
          tax: line.tax === 'vat_8' ? 'VAT 8%' : line.tax === 'vat_10' ? 'VAT 10%' : 'None',
        })),
      };

      navigate(`/financials/invoicing?${params.toString()}`, { state: { invoiceDraft } });
    } catch {
      toastErr('Could not create bill');
    } finally {
      setCreatingBill(false);
    }
  }, [jobId, persistedPnId, paymentNo, status, persistPayload, lines, jobNo, vendorName, payer, billingDate, dueDate, exchangeRate, navigate, toastErr]);

  return (
    <div className="animate-in fade-in duration-300 mx-auto flex w-full flex-col gap-4 px-0 pb-24 sm:px-1 md:pb-6">
      <div className="overflow-visible rounded-2xl border border-border bg-white shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-white via-white to-slate-50/40 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (jobId ? navigate(`/shipping/jobs/${jobId}/sea-house-bl`) : navigate('/shipping/jobs'))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-slate-600 shadow-sm transition-all hover:border-primary/25 hover:bg-primary/5 hover:text-primary touch-manipulation"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary leading-none mb-0.5">CD No.</p>
              <input
                value={paymentNo}
                onChange={(e) => setPaymentNo(e.target.value)}
                className="text-2xl font-black tracking-tight text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto lg:shrink-0">
            {status === 'approved' && (
              <button
                type="button"
                onClick={() => void handleCreateBill()}
                disabled={creatingBill}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Receipt size={14} />
                {creatingBill ? 'Working…' : 'Create Bill'}
              </button>
            )}
            <WorkflowStepper
              steps={[
                { id: 'draft', label: 'Draft', icon: FileText },
                { id: 'approved', label: 'Approved', icon: Send },
                { id: 'partial_billed', label: 'Partial Billed', icon: CreditCard },
                { id: 'billed', label: 'Billed', icon: Wallet },
                { id: 'cancel', label: 'Cancel', icon: XCircle, isCancel: true },
              ]}
              currentStep={status}
              onStepChange={(s) => {
                setStatus(s as PaymentNoteStatus);
                toastOk(`Status changed to ${s}`);
              }}
              variant="desktop"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-2 xl:grid-cols-2">
        <StatCard icon={FileText} label="Bills" value={lines.length} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Wallet} label="Payments" value={isPaid ? 1 : 0} color="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">Party Information</h2>
          </div>
          <div className="flex flex-col gap-3 p-5">
            <div className="grid grid-cols-2 gap-2">
              <input value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} className={inputClass} placeholder="Vendor code" />
              <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputClass} placeholder="Vendor name" />
            </div>
            <input value={payer} onChange={(e) => setPayer(e.target.value)} className={inputClass} placeholder="Payer" />
            <input value={shipper} onChange={(e) => setShipper(e.target.value)} className={inputClass} placeholder="Shipper" />
            <input value={consignee} onChange={(e) => setConsignee(e.target.value)} className={inputClass} placeholder="Consignee" />
            <input value={payFor} onChange={(e) => setPayFor(e.target.value)} className={inputClass} placeholder="Pay for" />
            <input value={pic} onChange={(e) => setPic(e.target.value)} className={inputClass} placeholder="PIC" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="Email" />
            <input value={vendorInvoiceNo} onChange={(e) => setVendorInvoiceNo(e.target.value)} className={inputClass} placeholder="Vendor invoice no." />
            <input value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputClass} placeholder="Payment type" />
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-700">
              <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="h-4 w-4 rounded border-border" />
              Mark is paid
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">Internal Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5">
            <div>
              <FieldLabel>Job</FieldLabel>
              <input value={jobNo} onChange={(e) => setJobNo(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Performance Date</FieldLabel>
              <DateInput value={performanceDate} onChange={setPerformanceDate} className="w-full" />
            </div>
            <div>
              <FieldLabel>Master BL</FieldLabel>
              <input value={masterBl} onChange={(e) => setMasterBl(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>House BL</FieldLabel>
              <input value={houseBl} onChange={(e) => setHouseBl(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>Reference No</FieldLabel>
              <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="shrink-0 border-b border-border bg-slate-50/80 px-5 py-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-primary">Accounting Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
          <div>
            <FieldLabel>Billing Date</FieldLabel>
            <DateInput value={billingDate} onChange={setBillingDate} className="w-full" />
          </div>
          <div>
            <FieldLabel>Due Date</FieldLabel>
            <DateInput value={dueDate} onChange={setDueDate} className="w-full" />
          </div>
          <div>
            <FieldLabel>Exchange Rate</FieldLabel>
            <input value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className={inputClass} placeholder="26,320.00" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-[12px]">
            <thead className="bg-slate-50">
              <tr className="border-b border-border">
                {['Vendor', 'Service', 'Fare', 'Fare Type', 'Fare Name', 'Tax', 'Currency', 'Exch. Rate', 'Unit', 'Qty', 'Rate', 'Amt (foreign)', 'Local Amt'].map((h) => (
                  <th key={h} className="px-2 py-2 text-left font-bold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const foreign = Number(line.qty || 0) * Number(line.rate || 0);
                const local = foreign * Number(line.exchangeRate || 0);
                return (
                  <tr key={line.id} className="border-b border-border/70">
                    <td className="px-2 py-1.5"><input value={line.vendor} onChange={(e) => updateLine(line.id, { vendor: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input value={line.service} onChange={(e) => updateLine(line.id, { service: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input value={line.fare} onChange={(e) => updateLine(line.id, { fare: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input value={line.fareType} onChange={(e) => updateLine(line.id, { fareType: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input value={line.fareName} onChange={(e) => updateLine(line.id, { fareName: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input value={line.tax} onChange={(e) => updateLine(line.id, { tax: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input value={line.currency} onChange={(e) => updateLine(line.id, { currency: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={line.exchangeRate} onChange={(e) => updateLine(line.id, { exchangeRate: Number(e.target.value) || 0 })} className={clsx(inputClass, '!h-8 !py-1 text-right')} /></td>
                    <td className="px-2 py-1.5"><input value={line.unit} onChange={(e) => updateLine(line.id, { unit: e.target.value })} className={clsx(inputClass, '!h-8 !py-1')} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={line.qty} onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) || 0 })} className={clsx(inputClass, '!h-8 !py-1 text-right')} /></td>
                    <td className="px-2 py-1.5"><input type="number" value={line.rate} onChange={(e) => updateLine(line.id, { rate: Number(e.target.value) || 0 })} className={clsx(inputClass, '!h-8 !py-1 text-right')} /></td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{foreign.toLocaleString('en-US')}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{local.toLocaleString('en-US')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-slate-50 px-4 py-3">
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
          >
            Add line
          </button>
          <div className="text-right text-[12px] font-semibold text-slate-700">
            Total bill: <span className="font-black">{totalBills.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentNotePage;

