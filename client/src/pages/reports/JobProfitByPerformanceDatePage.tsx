import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  List,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { reportsService, type JobProfitByPerformanceRow } from '../../services/reportsService';
import { useToastContext } from '../../contexts/ToastContext';

const thMoney =
  'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight whitespace-nowrap border-r border-border/40 text-right';
const tdMoney = 'px-3 py-3 border-r border-border/40 text-[12px] tabular-nums text-right text-slate-700';
const thText =
  'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-r border-border/40 text-left';
const tdText = 'px-3 py-3 border-r border-border/40 text-[12px] text-slate-700';

function fmtVnd(n: number) {
  return `${formatCurrency(n)} đ`;
}

function defaultRange(): { from: string; to: string } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return { from: ymd(start), to: ymd(end) };
}

type BucketKind = 'year' | 'quarter' | 'month' | 'week' | 'day';

type GroupBy = 'performance_date' | 'salesman' | `bucket_${BucketKind}`;

const BUCKET_KINDS: BucketKind[] = ['year', 'quarter', 'month', 'week', 'day'];

const BUCKET_LABELS: Record<BucketKind, string> = {
  year: 'Year',
  quarter: 'Quarter',
  month: 'Month',
  week: 'Week',
  day: 'Day',
};

function isBucketGroupBy(g: GroupBy): g is `bucket_${BucketKind}` {
  return g.startsWith('bucket_');
}

function bucketKindFromGroupBy(g: GroupBy): BucketKind | null {
  if (!isBucketGroupBy(g)) return null;
  const k = g.replace('bucket_', '') as BucketKind;
  return BUCKET_KINDS.includes(k) ? k : null;
}

function parseLocalYmd(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** ISO week key: YYYY-Www (Monday-based week, week 1 contains Jan 4). */
function isoWeekKeyFromLocalDate(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - ((week1.getDay() + 6) % 7) + 3) / 7);
  const isoYear = d.getFullYear();
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function bucketRawKey(ymd: string | null | undefined, kind: BucketKind): string {
  const raw = (ymd || '').trim();
  if (!raw) return '__none__';
  if (kind === 'day') return raw;
  const d = parseLocalYmd(raw);
  if (!d) return `__bad__:${raw}`;
  switch (kind) {
    case 'year':
      return String(d.getFullYear());
    case 'quarter': {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${q}`;
    }
    case 'month': {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${d.getFullYear()}-${mm}`;
    }
    case 'week':
      return isoWeekKeyFromLocalDate(d);
    default:
      return raw;
  }
}

function formatBucketPrimaryLabel(key: string, kind: BucketKind): string {
  if (key === '__none__') return 'No performance date';
  if (key.startsWith('__bad__:')) return key.replace('__bad__:', '') || '—';
  switch (kind) {
    case 'year':
      return key;
    case 'quarter': {
      const m = key.match(/^(\d{4})-Q(\d)$/);
      if (!m) return key;
      return `Q${m[2]} ${m[1]}`;
    }
    case 'month': {
      const p = parseLocalYmd(`${key}-01`);
      if (!p) return key;
      return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(p);
    }
    case 'week': {
      const m = key.match(/^(\d{4})-W(\d{2})$/);
      if (!m) return key;
      return `Week ${Number(m[2])}, ${m[1]}`;
    }
    case 'day':
      return formatDate(key);
    default:
      return key;
  }
}

function compareBucketKeys(a: string, b: string, kind: BucketKind): number {
  if (a === '__none__') return 1;
  if (b === '__none__') return -1;
  if (a.startsWith('__bad__:')) return 1;
  if (b.startsWith('__bad__:')) return -1;
  if (kind === 'year') return Number(b) - Number(a);
  if (kind === 'month' || kind === 'day') return b.localeCompare(a);
  if (kind === 'quarter') {
    const pa = a.match(/^(\d{4})-Q(\d)$/);
    const pb = b.match(/^(\d{4})-Q(\d)$/);
    if (!pa || !pb) return b.localeCompare(a);
    const va = Number(pa[1]) * 10 + Number(pa[2]);
    const vb = Number(pb[1]) * 10 + Number(pb[2]);
    return vb - va;
  }
  if (kind === 'week') {
    const pa = a.match(/^(\d{4})-W(\d{2})$/);
    const pb = b.match(/^(\d{4})-W(\d{2})$/);
    if (!pa || !pb) return b.localeCompare(a);
    const va = Number(pa[1]) * 100 + Number(pa[2]);
    const vb = Number(pb[1]) * 100 + Number(pb[2]);
    return vb - va;
  }
  return b.localeCompare(a);
}

function jobSummaryLabelForGroupBy(groupBy: GroupBy): string {
  switch (groupBy) {
    case 'performance_date':
      return 'Daily summary';
    case 'salesman':
      return 'Salesman summary';
    case 'bucket_year':
      return 'Year summary';
    case 'bucket_quarter':
      return 'Quarter summary';
    case 'bucket_month':
      return 'Month summary';
    case 'bucket_week':
      return 'Week summary';
    case 'bucket_day':
      return 'Day summary';
    default:
      return 'Summary';
  }
}

function groupByChipLabel(groupBy: GroupBy): string {
  if (groupBy === 'performance_date') return 'Performance Date';
  if (groupBy === 'salesman') return 'Salesman';
  const k = bucketKindFromGroupBy(groupBy);
  return k ? BUCKET_LABELS[k] : 'Group';
}

function performanceRangeLabel(rows: JobProfitByPerformanceRow[]): string {
  const dates = rows
    .map((r) => r.performance_date)
    .filter((d): d is string => Boolean(d))
    .sort();
  if (dates.length === 0) return '—';
  if (dates.length === 1) return formatDate(dates[0]!);
  const lo = dates[0]!;
  const hi = dates[dates.length - 1]!;
  return lo === hi ? formatDate(lo) : `${formatDate(lo)} – ${formatDate(hi)}`;
}

type ProfitGroup = {
  id: string;
  rows: JobProfitByPerformanceRow[];
  customerCount: number;
  summary: {
    pre_tax_sell: number;
    pre_tax_buy: number;
    pre_tax_margin: number;
    vat_sell: number;
    vat_buy: number;
    vat_margin: number;
    total_sell: number;
    total_buy: number;
    total_margin: number;
    avg_margin_percent: number | null;
  };
  primaryLabel: string;
  secondaryLabel: string;
  jobSummaryLabel: string;
  performanceLabel: string;
};

function summarizeRows(dateRows: JobProfitByPerformanceRow[]) {
  const summary = dateRows.reduce(
    (acc, row) => {
      acc.pre_tax_sell += row.pre_tax_sell;
      acc.pre_tax_buy += row.pre_tax_buy;
      acc.pre_tax_margin += row.pre_tax_margin;
      acc.vat_sell += row.vat_sell;
      acc.vat_buy += row.vat_buy;
      acc.vat_margin += row.vat_margin;
      acc.total_sell += row.total_sell;
      acc.total_buy += row.total_buy;
      acc.total_margin += row.total_margin;
      return acc;
    },
    {
      pre_tax_sell: 0,
      pre_tax_buy: 0,
      pre_tax_margin: 0,
      vat_sell: 0,
      vat_buy: 0,
      vat_margin: 0,
      total_sell: 0,
      total_buy: 0,
      total_margin: 0,
      avg_margin_percent: null as number | null,
    },
  );
  summary.avg_margin_percent =
    summary.total_sell > 0 ? (summary.total_margin / summary.total_sell) * 100 : null;
  return summary;
}

function buildProfitGroups(rows: JobProfitByPerformanceRow[], groupBy: GroupBy): ProfitGroup[] {
  if (groupBy === 'salesman') {
    const map = new Map<string, JobProfitByPerformanceRow[]>();
    for (const row of rows) {
      const key = (row.salesman_name || '').trim() || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))
      .map(([salesman, smRows]) => {
        const summary = summarizeRows(smRows);
        const customerCount = new Set(smRows.map((r) => r.customer_name || '—')).size;
        return {
          id: `s:${salesman}`,
          rows: smRows,
          customerCount,
          summary,
          primaryLabel: salesman,
          secondaryLabel: `${customerCount} customer(s)`,
          jobSummaryLabel: jobSummaryLabelForGroupBy(groupBy),
          performanceLabel: performanceRangeLabel(smRows),
        };
      });
  }

  const bucketKind = groupBy === 'performance_date' ? 'day' : bucketKindFromGroupBy(groupBy);
  if (!bucketKind) return [];

  const map = new Map<string, JobProfitByPerformanceRow[]>();
  for (const row of rows) {
    const rawKey = bucketRawKey(row.performance_date, bucketKind);
    if (!map.has(rawKey)) map.set(rawKey, []);
    map.get(rawKey)!.push(row);
  }

  const entries = Array.from(map.entries()).sort((a, b) => compareBucketKeys(a[0], b[0], bucketKind));

  return entries.map(([rawKey, bucketRows]) => {
    const summary = summarizeRows(bucketRows);
    const customerCount = new Set(bucketRows.map((r) => r.customer_name || '—')).size;
    const primaryLabel = formatBucketPrimaryLabel(rawKey, bucketKind);
    return {
      id: `b:${groupBy}:${rawKey}`,
      rows: bucketRows,
      customerCount,
      summary,
      primaryLabel,
      secondaryLabel: `${customerCount} customer(s)`,
      jobSummaryLabel: jobSummaryLabelForGroupBy(groupBy),
      performanceLabel: performanceRangeLabel(bucketRows),
    };
  });
}

type JobProfitGroupByMenuProps = {
  value: GroupBy;
  onChange: (next: GroupBy) => void;
  className?: string;
};

function JobProfitGroupByMenu({ value, onChange, className }: JobProfitGroupByMenuProps) {
  const [open, setOpen] = useState(false);
  const [subHover, setSubHover] = useState(false);
  const subPanelOpen = subHover || isBucketGroupBy(value);

  useEffect(() => {
    if (!open) setSubHover(false);
  }, [open]);

  const selectedBucket = bucketKindFromGroupBy(value);

  const chipClasses = (active: boolean) =>
    cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm w-auto min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
      open
        ? 'bg-primary/5 border-primary text-primary'
        : 'bg-white border-border hover:bg-muted text-muted-foreground',
      !active && 'text-muted-foreground/60',
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(chipClasses(true), 'max-w-full', className)}>
          <span className={cn('shrink-0', open ? 'text-primary' : 'text-muted-foreground/50')}>
            <Layers size={14} strokeWidth={2} />
          </span>
          <span className="truncate">{groupByChipLabel(value)}</span>
          <ChevronRight
            size={14}
            className={cn('shrink-0 opacity-40 transition-transform ml-1', open ? '-rotate-90' : 'rotate-90')}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-auto min-w-0 p-0 shadow-xl border-border/60">
        <div className="flex rounded-xl overflow-hidden">
          <div className="w-[13.5rem] py-1">
            <button
              type="button"
              onMouseEnter={() => setSubHover(false)}
              onClick={() => {
                onChange('performance_date');
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-primary/5 rounded-lg mx-0.5',
                value === 'performance_date' && 'bg-primary/10 text-primary',
              )}
            >
              <span className="flex w-4 shrink-0 justify-center">
                {value === 'performance_date' ? <Check className="h-4 w-4 text-primary" /> : null}
              </span>
              <span className="flex-1">Performance Date</span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-30" />
            </button>
            <button
              type="button"
              onMouseEnter={() => setSubHover(false)}
              onClick={() => {
                onChange('salesman');
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-primary/5 rounded-lg mx-0.5',
                value === 'salesman' && 'bg-primary/10 text-primary',
              )}
            >
              <span className="flex w-4 shrink-0 justify-center">
                {value === 'salesman' ? <Check className="h-4 w-4 text-primary" /> : null}
              </span>
              <span className="flex-1">Salesman</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setSubHover(true)}
              onClick={() => setSubHover(true)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-primary/5 rounded-lg mx-0.5',
                isBucketGroupBy(value) && 'bg-muted/40',
              )}
            >
              <span className="w-4 shrink-0" />
              <span className="flex-1">Add custom group</span>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
            </button>
          </div>
          {subPanelOpen ? (
            <div
              className="w-[9.5rem] border-l border-border/80 py-1"
              onMouseEnter={() => setSubHover(true)}
              onMouseLeave={() => setSubHover(false)}
            >
              {BUCKET_KINDS.map((kind) => {
                const optionValue = `bucket_${kind}` as GroupBy;
                const selected = selectedBucket === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      onChange(optionValue);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-primary/5 rounded-lg mx-0.5',
                      selected && 'bg-primary/10 text-primary',
                    )}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                    </span>
                    <span className="flex-1">{BUCKET_LABELS[kind]}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const JobProfitByPerformanceDatePage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError } = useToastContext();
  const [draftRange, setDraftRange] = useState(defaultRange);
  const [applied, setApplied] = useState(defaultRange);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [rows, setRows] = useState<JobProfitByPerformanceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('performance_date');
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit) || 1), [total, limit]);

  const statsSummary = useMemo(() => summarizeRows(rows), [rows]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsService.getJobProfitByPerformanceDate({
        from: applied.from,
        to: applied.to,
        page,
        limit,
      });
      setRows(res.rows);
      setTotal(res.pagination.total);
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Failed to load report');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [applied.from, applied.to, page, limit, toastError]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const visibleGroups = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let data = rows;
    if (q) {
      data = rows.filter((r) => {
        const blob = [
          r.customer_name,
          r.salesman_name,
          r.master_job_no,
          r.performance_date,
          formatDate(r.performance_date),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return buildProfitGroups(data, groupBy);
  }, [rows, searchText, groupBy]);

  useEffect(() => {
    if (visibleGroups.length === 0) {
      setExpandedGroupIds({});
      return;
    }
    setExpandedGroupIds((prev) => {
      const next: Record<string, boolean> = {};
      for (const g of visibleGroups) {
        next[g.id] = prev[g.id] ?? true;
      }
      return next;
    });
  }, [visibleGroups]);

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const dateRangeOnUpdate = (range: { from: Date; to?: Date }) => {
    const next = {
      from: range.from.toISOString().slice(0, 10),
      to: (range.to ?? range.from).toISOString().slice(0, 10),
    };
    setDraftRange(next);
    setApplied(next);
    setPage(1);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="flex items-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'list'
              ? 'bg-white text-primary shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <List size={14} />
          List View
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'stats'
              ? 'bg-white text-primary shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BarChart2 size={14} />
          Statistics
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-slate-50/40 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Jobs (page)</p>
              <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">{rows.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50/40 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total sell</p>
              <p className="mt-1 text-xl font-black text-slate-900 tabular-nums">{fmtVnd(statsSummary.total_sell)}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50/40 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total buy</p>
              <p className="mt-1 text-xl font-black text-slate-900 tabular-nums">{fmtVnd(statsSummary.total_buy)}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50/40 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total margin</p>
              <p className="mt-1 text-xl font-black text-primary tabular-nums">{fmtVnd(statsSummary.total_margin)}</p>
            </div>
          </div>
          <p className="mt-6 text-[12px] text-muted-foreground">
            Figures sum the jobs on the current page only. Use List View and pagination to review the full range.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search jobs, customers, salesmen..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground shrink-0"
              title="Refresh"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="md:hidden flex flex-wrap items-center gap-2 p-3 border-b border-border">
            <div className="relative min-w-0 flex-1">
              <DateRangePicker
                triggerVariant="filterChip"
                showCompare={false}
                align="start"
                initialDateFrom={draftRange.from}
                initialDateTo={draftRange.to}
                onUpdate={({ range }) => dateRangeOnUpdate(range)}
              />
            </div>
            <div className="relative min-w-0 flex-1">
              <JobProfitGroupByMenu className="w-full min-w-0" value={groupBy} onChange={setGroupBy} />
            </div>
          </div>

          <div className="hidden md:block p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="relative flex-1 max-w-sm min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search jobs, customers, salesmen..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void fetchData()}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
                  title="Refresh"
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap items-center gap-2">
              <div className="relative shrink-0">
                <DateRangePicker
                  triggerVariant="filterChip"
                  showCompare={false}
                  align="start"
                  initialDateFrom={draftRange.from}
                  initialDateTo={draftRange.to}
                  onUpdate={({ range }) => dateRangeOnUpdate(range)}
                />
              </div>
              <div className="relative shrink-0">
                <JobProfitGroupByMenu className="min-w-40 max-w-[16rem]" value={groupBy} onChange={setGroupBy} />
              </div>
            </div>
          </div>

          <div className="md:hidden flex-1 overflow-x-auto p-3 min-h-0">
            <div className="min-w-[1100px]">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th className={clsx(thText, 'min-w-[140px]')}>Customer</th>
                    <th className={clsx(thText, 'min-w-[120px]')}>Salesman</th>
                    <th className={clsx(thText, 'min-w-[100px]')}>Job</th>
                    <th className={clsx(thText, 'min-w-[100px]')}>Performance</th>
                    <th className={thMoney}>Pre-tax Sell</th>
                    <th className={thMoney}>Pre-tax Buy</th>
                    <th className={thMoney}>Pre-tax Margin</th>
                    <th className={thMoney}>VAT Sell</th>
                    <th className={thMoney}>VAT Buy</th>
                    <th className={thMoney}>VAT Margin</th>
                    <th className={thMoney}>Total Sell</th>
                    <th className={thMoney}>Total Buy</th>
                    <th className={thMoney}>Total Margin</th>
                    <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight text-right">
                      Margin (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={14} className="px-4 py-4 bg-slate-50/30 border-b border-border/40" />
                      </tr>
                    ))
                  ) : visibleGroups.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-4 py-16 text-center text-[13px] text-muted-foreground italic">
                        No jobs with performance date in this range.
                      </td>
                    </tr>
                  ) : (
                    visibleGroups.map((group) => (
                      <React.Fragment key={`m-${group.id}`}>
                        <tr
                          className="bg-slate-100/70 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedGroupIds((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                          }
                        >
                          <td className={tdText}>
                            <div className="flex items-center gap-2 font-bold">
                              {expandedGroupIds[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {group.primaryLabel}
                            </div>
                          </td>
                          <td className={tdText}>
                            <span className="font-semibold">{group.secondaryLabel}</span>
                          </td>
                          <td className={tdText}>{group.jobSummaryLabel}</td>
                          <td className={tdText}>{group.performanceLabel}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.pre_tax_sell)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.pre_tax_buy)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.pre_tax_margin)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.vat_sell)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.vat_buy)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.vat_margin)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.total_sell)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.total_buy)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.total_margin)}</td>
                          <td className="px-3 py-3 text-[12px] font-bold tabular-nums text-right text-slate-700">
                            {group.summary.avg_margin_percent === null
                              ? '—'
                              : `${group.summary.avg_margin_percent.toFixed(2)}%`}
                          </td>
                        </tr>
                        {expandedGroupIds[group.id] &&
                          group.rows.map((r) => (
                            <tr key={`m-${r.job_id}`} className="hover:bg-slate-50/60 transition-colors">
                              <td className={clsx(tdText, 'pl-8')}>
                                <span className="font-medium">{r.customer_name || '—'}</span>
                              </td>
                              <td className={tdText}>{r.salesman_name || '—'}</td>
                              <td className={tdText}>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/shipments/sop/${r.job_id}`)}
                                  className="font-bold text-primary hover:underline text-left"
                                >
                                  {r.master_job_no || '—'}
                                </button>
                              </td>
                              <td className={tdText}>{formatDate(r.performance_date)}</td>
                              <td className={tdMoney}>{fmtVnd(r.pre_tax_sell)}</td>
                              <td className={tdMoney}>{fmtVnd(r.pre_tax_buy)}</td>
                              <td className={tdMoney}>{fmtVnd(r.pre_tax_margin)}</td>
                              <td className={tdMoney}>{fmtVnd(r.vat_sell)}</td>
                              <td className={tdMoney}>{fmtVnd(r.vat_buy)}</td>
                              <td className={tdMoney}>{fmtVnd(r.vat_margin)}</td>
                              <td className={tdMoney}>{fmtVnd(r.total_sell)}</td>
                              <td className={tdMoney}>{fmtVnd(r.total_buy)}</td>
                              <td className={tdMoney}>{fmtVnd(r.total_margin)}</td>
                              <td className="px-3 py-3 text-[12px] tabular-nums text-right text-slate-700">
                                {r.margin_percent === null || r.margin_percent === undefined
                                  ? '—'
                                  : `${r.margin_percent.toFixed(2)}%`}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20 max-h-[calc(100vh-320px)]">
            <div className="min-w-[1100px] md:min-w-0">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className={clsx(thText, 'min-w-[140px]')}>Customer</th>
                    <th className={clsx(thText, 'min-w-[120px]')}>Salesman</th>
                    <th className={clsx(thText, 'min-w-[100px]')}>Job</th>
                    <th className={clsx(thText, 'min-w-[100px]')}>Performance</th>
                    <th className={thMoney}>Pre-tax Sell</th>
                    <th className={thMoney}>Pre-tax Buy</th>
                    <th className={thMoney}>Pre-tax Margin</th>
                    <th className={thMoney}>VAT Sell</th>
                    <th className={thMoney}>VAT Buy</th>
                    <th className={thMoney}>VAT Margin</th>
                    <th className={thMoney}>Total Sell</th>
                    <th className={thMoney}>Total Buy</th>
                    <th className={thMoney}>Total Margin</th>
                    <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight text-right">
                      Margin (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={14} className="px-4 py-4 bg-slate-50/30 border-b border-border/40" />
                      </tr>
                    ))
                  ) : visibleGroups.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-4 py-16 text-center text-[13px] text-muted-foreground italic">
                        No jobs with performance date in this range.
                      </td>
                    </tr>
                  ) : (
                    visibleGroups.map((group) => (
                      <React.Fragment key={group.id}>
                        <tr
                          className="bg-slate-100/70 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedGroupIds((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                          }
                        >
                          <td className={tdText}>
                            <div className="flex items-center gap-2 font-bold">
                              {expandedGroupIds[group.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {group.primaryLabel}
                            </div>
                          </td>
                          <td className={tdText}>
                            <span className="font-semibold">{group.secondaryLabel}</span>
                          </td>
                          <td className={tdText}>{group.jobSummaryLabel}</td>
                          <td className={tdText}>{group.performanceLabel}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.pre_tax_sell)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.pre_tax_buy)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.pre_tax_margin)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.vat_sell)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.vat_buy)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.vat_margin)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.total_sell)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.total_buy)}</td>
                          <td className={tdMoney}>{fmtVnd(group.summary.total_margin)}</td>
                          <td className="px-3 py-3 text-[12px] font-bold tabular-nums text-right text-slate-700">
                            {group.summary.avg_margin_percent === null
                              ? '—'
                              : `${group.summary.avg_margin_percent.toFixed(2)}%`}
                          </td>
                        </tr>
                        {expandedGroupIds[group.id] &&
                          group.rows.map((r) => (
                            <tr key={r.job_id} className="hover:bg-slate-50/60 transition-colors">
                              <td className={clsx(tdText, 'pl-8')}>
                                <span className="font-medium">{r.customer_name || '—'}</span>
                              </td>
                              <td className={tdText}>{r.salesman_name || '—'}</td>
                              <td className={tdText}>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/shipments/sop/${r.job_id}`)}
                                  className="font-bold text-primary hover:underline text-left"
                                >
                                  {r.master_job_no || '—'}
                                </button>
                              </td>
                              <td className={tdText}>{formatDate(r.performance_date)}</td>
                              <td className={tdMoney}>{fmtVnd(r.pre_tax_sell)}</td>
                              <td className={tdMoney}>{fmtVnd(r.pre_tax_buy)}</td>
                              <td className={tdMoney}>{fmtVnd(r.pre_tax_margin)}</td>
                              <td className={tdMoney}>{fmtVnd(r.vat_sell)}</td>
                              <td className={tdMoney}>{fmtVnd(r.vat_buy)}</td>
                              <td className={tdMoney}>{fmtVnd(r.vat_margin)}</td>
                              <td className={tdMoney}>{fmtVnd(r.total_sell)}</td>
                              <td className={tdMoney}>{fmtVnd(r.total_buy)}</td>
                              <td className={tdMoney}>{fmtVnd(r.total_margin)}</td>
                              <td className="px-3 py-3 text-[12px] tabular-nums text-right text-slate-700">
                                {r.margin_percent === null || r.margin_percent === undefined
                                  ? '—'
                                  : `${r.margin_percent.toFixed(2)}%`}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
          <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="text-[12px] font-medium text-slate-500">
              Showing <b>{showingFrom}</b> – <b>{showingTo}</b> of <b>{total}</b> result(s)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 text-[12px] font-bold text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobProfitByPerformanceDatePage;
