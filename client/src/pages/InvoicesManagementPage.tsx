import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  RefreshCcw,
  Search,
  Briefcase,
  Receipt,
  Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDate } from '../lib/utils';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { useToastContext } from '../contexts/ToastContext';
import { fmsJobInvoiceService } from '../services/fmsJobInvoiceService';
import { jobService } from '../services/jobService';
import type { FmsJob } from './jobs/types';
import type {
  FmsJobInvoiceListItem,
  FmsJobInvoicePaymentStatus,
  FmsJobInvoiceStatus,
  JobInvoiceListQuery,
} from './invoices/types';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function daysFromDue(isoDate: string): number {
  const d = new Date(isoDate + 'T12:00:00');
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

function dueSummary(due: string | null): { text: string; tone: 'muted' | 'amber' | 'red' } {
  if (!due) return { text: '—', tone: 'muted' };
  const days = daysFromDue(due.slice(0, 10));
  if (days === 0) return { text: 'Due today', tone: 'amber' };
  if (days > 0) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'muted' };
  const overdue = -days;
  return { text: `${overdue} day${overdue === 1 ? '' : 's'} overdue`, tone: 'red' };
}

const STATUS_LABELS: Record<FmsJobInvoiceStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
};

const PAYMENT_LABELS: Record<FmsJobInvoicePaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  partial: 'Partially paid',
};

function paymentBadgeClass(s: FmsJobInvoicePaymentStatus) {
  if (s === 'paid') return 'bg-emerald-600';
  if (s === 'partial') return 'bg-amber-600';
  return 'bg-red-600';
}

function statusBadgeClass(s: FmsJobInvoiceStatus) {
  if (s === 'posted') return 'bg-emerald-600';
  return 'bg-blue-600';
}

const InvoicesManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { info, error } = useToastContext();
  const [rows, setRows] = useState<FmsJobInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [searchText, setSearchText] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [jobs, setJobs] = useState<FmsJob[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeDropdown) return;
    const onDoc = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [activeDropdown]);

  const listQuery: JobInvoiceListQuery = useMemo(() => {
    const q: JobInvoiceListQuery = {
      page,
      limit,
      status: selectedStatuses.length ? selectedStatuses : undefined,
      payment_status: selectedPayments.length ? selectedPayments : undefined,
      job_id: selectedJobs.length ? selectedJobs : undefined,
    };
    if (searchText.trim()) q.search = searchText.trim();
    return q;
  }, [page, limit, searchText, selectedStatuses, selectedPayments, selectedJobs]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { items, pagination } = await fmsJobInvoiceService.listAll(listQuery);
      setRows(items);
      setTotal(pagination.total);
    } catch (e) {
      console.error(e);
      error(e instanceof Error ? e.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [listQuery, error]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await jobService.getJobs(1, 200);
        if (!cancelled) setJobs(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setJobs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchText, selectedStatuses, selectedPayments, selectedJobs]);

  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedPayments.length > 0 || selectedJobs.length > 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length && rows.length > 0) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openInvoice = (r: FmsJobInvoiceListItem) => {
    const p = new URLSearchParams();
    p.set('jobId', r.job_id);
    p.set('invoiceId', r.id);
    p.set('dnId', r.debit_note_id);
    if (r.debit_note_no) p.set('dnNo', r.debit_note_no);
    if (r.master_job_no) p.set('jobNo', r.master_job_no);
    navigate(`/financials/invoicing?${p.toString()}`);
  };

  return (
    <div className="animate-in fade-in duration-300 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
        {/* Mobile toolbar (Shipments-style) */}
        <div className="md:hidden flex items-center gap-2 p-3 border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => navigate('/finance')}
            className="p-2 rounded-xl border border-border bg-white text-muted-foreground shrink-0"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Search by invoice no. or job…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
            />
          </div>
          <button
            type="button"
            className={clsx(
              'p-2 rounded-xl border shrink-0',
              hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-muted-foreground',
            )}
            aria-label="Filters"
          >
            <Filter size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/financials/invoicing')}
            className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20 shrink-0"
            aria-label="New invoice"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Desktop toolbar (same row layout as Shipments: Back + search left, actions right) */}
        <div className="hidden md:block p-4 space-y-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/finance')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <div className="relative flex-1 max-w-sm min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Search by invoice no. or job…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void fetchList()}
                className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
                title="Refresh"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/financials/invoicing')}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all font-inter"
              >
                <Plus size={16} />
                New invoice
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(activeDropdown === 'status' ? null : 'status');
                  setFilterSearch('');
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-bold shadow-sm',
                  activeDropdown === 'status' || selectedStatuses.length
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-white border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <Receipt size={14} />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedStatuses.length}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className={clsx(
                    'transition-transform ml-1 opacity-40',
                    activeDropdown === 'status' ? '-rotate-90' : 'rotate-90',
                  )}
                />
              </button>
              <FilterDropdown
                isOpen={activeDropdown === 'status'}
                options={(['draft', 'posted'] as FmsJobInvoiceStatus[]).map((k) => ({
                  id: k,
                  label: STATUS_LABELS[k],
                  count: rows.filter((r) => r.status === k).length,
                }))}
                selected={selectedStatuses}
                onToggle={(id) =>
                  setSelectedStatuses((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                searchValue={filterSearch}
                onSearchChange={setFilterSearch}
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(activeDropdown === 'pay' ? null : 'pay');
                  setFilterSearch('');
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-bold shadow-sm',
                  activeDropdown === 'pay' || selectedPayments.length
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-white border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <Wallet size={14} />
                Payment
                {selectedPayments.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedPayments.length}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className={clsx(
                    'transition-transform ml-1 opacity-40',
                    activeDropdown === 'pay' ? '-rotate-90' : 'rotate-90',
                  )}
                />
              </button>
              <FilterDropdown
                isOpen={activeDropdown === 'pay'}
                options={(['unpaid', 'partial', 'paid'] as FmsJobInvoicePaymentStatus[]).map((k) => ({
                  id: k,
                  label: PAYMENT_LABELS[k],
                  count: rows.filter((r) => r.payment_status === k).length,
                }))}
                selected={selectedPayments}
                onToggle={(id) =>
                  setSelectedPayments((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                searchValue={filterSearch}
                onSearchChange={setFilterSearch}
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setActiveDropdown(activeDropdown === 'job' ? null : 'job');
                  setFilterSearch('');
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-bold shadow-sm',
                  activeDropdown === 'job' || selectedJobs.length
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-white border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <Briefcase size={14} />
                Job
                {selectedJobs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedJobs.length}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className={clsx(
                    'transition-transform ml-1 opacity-40',
                    activeDropdown === 'job' ? '-rotate-90' : 'rotate-90',
                  )}
                />
              </button>
              <FilterDropdown
                isOpen={activeDropdown === 'job'}
                options={jobs.map((j) => ({ id: j.id, label: j.master_job_no }))}
                selected={selectedJobs}
                onToggle={(id) =>
                  setSelectedJobs((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                searchValue={filterSearch}
                onSearchChange={setFilterSearch}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatuses([]);
                  setSelectedPayments([]);
                  setSelectedJobs([]);
                }}
                className="text-[12px] font-bold text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 border-t border-border">
          <div className="flex-1 overflow-auto min-h-0 bg-slate-50/20">
            <table className="w-full border-separate border-spacing-0 text-[13px] min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                <th className="px-3 py-3 w-10 border-b border-border/60">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === rows.length && rows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Number</th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Job</th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Original ref.</th>
                <th className="px-3 py-3 border-b border-border/60 min-w-[140px]">Customer</th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Invoice date</th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Due</th>
                <th className="px-3 py-3 border-b border-border/60 text-center w-12">Activity</th>
                <th className="px-3 py-3 border-b border-border/60 text-right whitespace-nowrap">Excl. tax</th>
                <th className="px-3 py-3 border-b border-border/60 text-right whitespace-nowrap">Total</th>
                <th className="px-3 py-3 border-b border-border/60 text-right whitespace-nowrap">In currency</th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Payment</th>
                <th className="px-3 py-3 border-b border-border/60 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 border-b border-border/60 text-center w-14" title="Coming soon">
                  Exclude
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-16 text-center text-muted-foreground animate-pulse">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-16 text-center text-muted-foreground italic">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const due = dueSummary(r.due_date);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => openInvoice(r)}
                      className="border-b border-border/40 hover:bg-slate-50/80 cursor-pointer"
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-3 py-3 font-bold text-primary whitespace-nowrap">{r.invoice_no}</td>
                      <td className="px-3 py-3">
                        {r.master_job_no ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {r.master_job_no}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{r.original_invoice_no || '—'}</td>
                      <td className="px-3 py-3 font-medium max-w-[200px] truncate">{r.customer_name || '—'}</td>
                      <td className="px-3 py-3 tabular-nums whitespace-nowrap">
                        {r.invoice_date ? formatDate(r.invoice_date) : '—'}
                      </td>
                      <td
                        className={clsx(
                          'px-3 py-3 whitespace-nowrap font-medium',
                          due.tone === 'red' && 'text-red-600',
                          due.tone === 'amber' && 'text-amber-700',
                          due.tone === 'muted' && 'text-muted-foreground',
                        )}
                      >
                        {due.text}
                      </td>
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Activity log — coming soon"
                          onClick={() => info('Activity log — coming soon')}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                        >
                          <Clock size={16} />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium">{formatMoney(r.untaxed_amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black">
                        {formatMoney(Number(r.grand_total) || 0)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                        {formatMoney(Number(r.grand_total) || 0)} {r.currency}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold text-white inline-block text-center min-w-[88px]',
                            paymentBadgeClass(r.payment_status),
                          )}
                        >
                          {PAYMENT_LABELS[r.payment_status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold text-white inline-block text-center min-w-[72px]',
                            statusBadgeClass(r.status),
                          )}
                        >
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" disabled className="rounded border-border opacity-40 cursor-not-allowed" title="Coming soon" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>

        <div className="px-4 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-[12px] text-muted-foreground">
            Showing <b>{total === 0 ? 0 : (page - 1) * limit + 1}</b> – <b>{Math.min(page * limit, total)}</b> of{' '}
            <b>{total}</b>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 text-[12px] font-bold text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesManagementPage;
