import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { formatDate } from '../../lib/utils';
import { useToastContext } from '../../contexts/ToastContext';
import {
  DEFAULT_ACCOUNT,
  RECEIVABLE_AGING_PARTNERS,
  type ReceivableAgingInvoice,
  type ReceivableAgingPartner,
} from './receivableAgingMock';

function fmtMoney(n: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)} VND`;
}

function moneyCell(n: number, opts?: { total?: boolean }) {
  const neg = n < 0;
  return (
    <span
      className={clsx(
        'tabular-nums',
        opts?.total && 'font-bold text-red-600',
        !opts?.total && neg && 'text-red-600 font-medium',
        !opts?.total && !neg && 'text-slate-800',
      )}
    >
      {fmtMoney(n)}
    </span>
  );
}

const BUCKET_HEADERS = ['1–30', '31–60', '61–90', '91–120', 'Older'] as const;

const ReceivableAgingPage: React.FC = () => {
  const navigate = useNavigate();
  const { info } = useToastContext();
  const [asOf, setAsOf] = useState('2026-03-19');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [accountOpen, setAccountOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<{ code: string; label: string } | null>(DEFAULT_ACCOUNT);
  const [partnerFilterId, setPartnerFilterId] = useState<string | null>(null);

  const asOfDisplay = useMemo(() => {
    try {
      return format(parseISO(asOf), 'PP', { locale: enUS });
    } catch {
      return asOf;
    }
  }, [asOf]);

  const visiblePartners = useMemo(() => {
    if (!partnerFilterId) return RECEIVABLE_AGING_PARTNERS;
    return RECEIVABLE_AGING_PARTNERS.filter((p) => p.id === partnerFilterId);
  }, [partnerFilterId]);

  const grand = useMemo(() => {
    return visiblePartners.reduce(
      (acc, p) => ({
        d1: acc.d1 + p.d1,
        d2: acc.d2 + p.d2,
        d3: acc.d3 + p.d3,
        d4: acc.d4 + p.d4,
        d5: acc.d5 + p.d5,
        total: acc.total + p.total,
      }),
      { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, total: 0 },
    );
  }, [visiblePartners]);

  const togglePartner = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderInvoiceRow = (inv: ReceivableAgingInvoice, zebra: boolean) => (
    <tr
      key={inv.id}
      className={clsx(
        'border-b border-border/40 text-[12px] hover:bg-slate-100/70',
        zebra && 'bg-slate-50/35',
      )}
    >
      <td className="px-3 py-2 pl-12 text-slate-700 wrap-break-word">{inv.label}</td>
      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
      <td className="px-3 py-2 text-center text-muted-foreground">{inv.currency}</td>
      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{inv.account}</td>
      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(inv.dueDate)}</td>
      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(inv.onDate)}</td>
      <td className="px-3 py-2 text-right">{moneyCell(inv.d1)}</td>
      <td className="px-3 py-2 text-right">{moneyCell(inv.d2)}</td>
      <td className="px-3 py-2 text-right">{moneyCell(inv.d3)}</td>
      <td className="px-3 py-2 text-right">{moneyCell(inv.d4)}</td>
      <td className="px-3 py-2 text-right">{moneyCell(inv.d5)}</td>
      <td className="px-3 py-2 text-right font-medium">{moneyCell(inv.total)}</td>
    </tr>
  );

  const renderPartnerRow = (p: ReceivableAgingPartner, rowIndex: number) => {
    const open = expanded.has(p.id);
    const zebra = rowIndex % 2 === 1;
    return (
      <React.Fragment key={p.id}>
        <tr
          className={clsx(
            'border-b border-border/50 text-[13px] hover:bg-slate-100/80',
            zebra && 'bg-slate-50/40',
          )}
        >
          <td className="px-3 py-2.5 font-semibold text-foreground">
            <div className="flex items-center gap-1 min-w-0">
              <button
                type="button"
                onClick={() => togglePartner(p.id)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                aria-expanded={open}
                aria-label={open ? 'Collapse' : 'Expand'}
              >
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <span className="wrap-break-word">{p.name}</span>
            </div>
          </td>
          <td className="px-3 py-2.5 text-muted-foreground">—</td>
          <td className="px-3 py-2.5 text-center text-muted-foreground">—</td>
          <td className="px-3 py-2.5 text-center text-muted-foreground">—</td>
          <td className="px-3 py-2.5 text-muted-foreground">—</td>
          <td className="px-3 py-2.5 text-muted-foreground">—</td>
          <td className="px-3 py-2.5 text-right">{moneyCell(p.d1)}</td>
          <td className="px-3 py-2.5 text-right">{moneyCell(p.d2)}</td>
          <td className="px-3 py-2.5 text-right">{moneyCell(p.d3)}</td>
          <td className="px-3 py-2.5 text-right">{moneyCell(p.d4)}</td>
          <td className="px-3 py-2.5 text-right">{moneyCell(p.d5)}</td>
          <td className="px-3 py-2.5 text-right font-bold text-slate-900">{moneyCell(p.total)}</td>
        </tr>
        {open && p.invoices.map((inv, i) => renderInvoiceRow(inv, (rowIndex + i) % 2 === 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col min-h-0 -mt-2 bg-muted/30">
      <div className="flex flex-col gap-4 px-4 md:px-6 py-4 md:py-6 w-full max-w-none flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 shrink-0 space-y-4 w-full min-w-0">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/finance')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-bold bg-white shrink-0"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              </div>
              <h1 className="text-lg md:text-xl font-black text-foreground tracking-tight font-inter">
                Accounts receivable aging
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => info('PDF export will be available when the reporting API is connected.')}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-sm"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => info('XLSX export will be available when the reporting API is connected.')}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 shadow-sm"
                >
                  XLSX
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-0 xl:items-end">
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <label className="inline-flex items-center gap-1.5 text-[11px] md:text-[12px] text-muted-foreground">
                  <CalendarDays size={14} className="shrink-0 opacity-70" />
                  <span className="whitespace-nowrap">As of</span>
                  <input
                    type="date"
                    value={asOf}
                    onChange={(e) => setAsOf(e.target.value)}
                    className="rounded border border-border bg-white px-1.5 py-0.5 text-[11px] font-medium text-foreground max-w-38"
                  />
                </label>

                <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={clsx(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-bold shadow-sm',
                        accountFilter ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-border text-muted-foreground',
                      )}
                    >
                      <Wallet size={14} />
                      Account
                      <ChevronDown size={14} className="opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Posting account</p>
                    {accountFilter ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-2 py-1.5">
                        <span className="text-[12px] font-medium">
                          {accountFilter.code} — {accountFilter.label}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">All accounts</p>
                    )}
                    <button
                      type="button"
                      className="text-[12px] font-bold text-primary hover:underline"
                      onClick={() => {
                        setAccountFilter(null);
                        setAccountOpen(false);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left text-[12px] font-medium text-slate-700 hover:text-primary"
                      onClick={() => {
                        setAccountFilter(DEFAULT_ACCOUNT);
                        setAccountOpen(false);
                      }}
                    >
                      Reset to {DEFAULT_ACCOUNT.code} — {DEFAULT_ACCOUNT.label}
                    </button>
                  </PopoverContent>
                </Popover>

                <Popover open={partnerOpen} onOpenChange={setPartnerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={clsx(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-bold shadow-sm',
                        partnerFilterId ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-border text-muted-foreground',
                      )}
                    >
                      <Users size={14} />
                      Partner
                      <ChevronDown size={14} className="opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-2">
                    <button
                      type="button"
                      className={clsx(
                        'w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium',
                        !partnerFilterId ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                      )}
                      onClick={() => {
                        setPartnerFilterId(null);
                        setPartnerOpen(false);
                      }}
                    >
                      All partners
                    </button>
                    {RECEIVABLE_AGING_PARTNERS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={clsx(
                          'w-full text-left px-2 py-1.5 rounded-lg text-[12px] font-medium',
                          partnerFilterId === p.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                        )}
                        onClick={() => {
                          setPartnerFilterId(p.id);
                          setPartnerOpen(false);
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="inline-flex items-start gap-1.5 text-[11px] md:text-[12px] text-muted-foreground max-w-xl xl:text-right">
                <Filter size={14} className="shrink-0 opacity-70 mt-0.5" />
                <span>Options: Exclude entries marked non-reporting; posted entries only</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full min-w-0 flex flex-col">
          <div className="w-full flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-border text-right text-[12px] text-muted-foreground shrink-0">
              As of {asOfDisplay}
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full border-collapse text-[13px] min-w-[980px]">
                <thead className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
                  <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    <th className="px-3 py-3 min-w-[160px]">Partner / document</th>
                    <th className="px-3 py-3 whitespace-nowrap">Invoice date</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Original ccy</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Account</th>
                    <th className="px-3 py-3 whitespace-nowrap">Due date</th>
                    <th className="px-3 py-3 whitespace-nowrap">On date</th>
                    {BUCKET_HEADERS.map((h) => (
                      <th key={h} className="px-3 py-3 text-right whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60 bg-slate-100/80 text-[13px]">
                    <td className="px-3 py-2.5 font-black text-foreground">Total</td>
                    <td colSpan={5} className="px-3 py-2.5 text-muted-foreground" />
                    <td className="px-3 py-2.5 text-right">{moneyCell(grand.d1, { total: true })}</td>
                    <td className="px-3 py-2.5 text-right">{moneyCell(grand.d2, { total: true })}</td>
                    <td className="px-3 py-2.5 text-right">{moneyCell(grand.d3, { total: true })}</td>
                    <td className="px-3 py-2.5 text-right">{moneyCell(grand.d4, { total: true })}</td>
                    <td className="px-3 py-2.5 text-right">{moneyCell(grand.d5, { total: true })}</td>
                    <td className="px-3 py-2.5 text-right font-black">{moneyCell(grand.total, { total: true })}</td>
                  </tr>
                  {visiblePartners.map((p, idx) => renderPartnerRow(p, idx))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center shrink-0 pb-2">
          Sample data for layout only — will be replaced by live subledger data.
        </p>
      </div>
    </div>
  );
};

export default ReceivableAgingPage;
