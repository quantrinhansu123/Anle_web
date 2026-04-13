import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ChevronLeft, Search, Plus, List, Edit, Trash2, RefreshCcw,
  BarChart2, Briefcase, ChevronRight, X, Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import { useToastContext } from '../contexts/ToastContext';
import { ThreeStarRating } from '../components/ui/ThreeStarRating';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { jobService } from '../services/jobService';
import { normalizeJobWorkflowStatus, type FmsJob, type JobBound, type JobWorkflowStatus } from './jobs/types';

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (row: FmsJob) => React.ReactNode };

const BOUND_META: Record<JobBound, { label: string; className: string }> = {
  import: { label: 'Import', className: 'bg-sky-50 text-sky-800 border-sky-200' },
  export: { label: 'Export', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  domestic: { label: 'Domestic', className: 'bg-violet-50 text-violet-800 border-violet-200' },
  transit: { label: 'Transit', className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const WORKFLOW_META: Record<JobWorkflowStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  closed: { label: 'Closed', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-800 border-red-200' },
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB').format(date);
};

const COLUMN_DEFS: Record<string, ColDef> = {
  masterJobNo: {
    label: 'Master Job No.',
    thClass:
      'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-[1%] whitespace-nowrap border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40 text-[12px] font-bold text-primary whitespace-nowrap',
    renderContent: (row) => <span>{row.master_job_no}</span>,
  },
  jobDate: {
    label: 'Date',
    thClass: 'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-28 border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40 text-[12px] text-slate-700',
    renderContent: (row) => <span>{formatDate(row.job_date)}</span>,
  },
  services: {
    label: 'Services',
    thClass: 'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[140px] border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40 text-[12px] text-slate-700',
    renderContent: (row) => <span className="line-clamp-2">{row.services || '—'}</span>,
  },
  bound: {
    label: 'Bound',
    thClass: 'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-28 border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40',
    renderContent: (row) => {
      const b = row.bound;
      if (!b) return <span className="text-muted-foreground">—</span>;
      const meta = BOUND_META[b];
      return (
        <span className={clsx('px-2 py-1 rounded-lg border text-[11px] font-bold', meta.className)}>{meta.label}</span>
      );
    },
  },
  customer: {
    label: 'Customer',
    thClass:
      'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[18rem] w-[32%] border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40 text-[12px] font-semibold text-slate-700 min-w-[18rem]',
    renderContent: (row) => <span>{row.customers?.company_name || '—'}</span>,
  },
  workflow: {
    label: 'Workflow',
    thClass: 'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32 border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40',
    renderContent: (row) => {
      const w = normalizeJobWorkflowStatus(row.workflow_status);
      const meta = WORKFLOW_META[w];
      return (
        <span className={clsx('px-2 py-1 rounded-lg border text-[11px] font-bold', meta.className)}>{meta.label}</span>
      );
    },
  },
  priority: {
    label: 'Priority',
    thClass: 'px-3 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-28 border-r border-border/40',
    tdClass: 'px-3 py-4 border-r border-border/40',
    renderContent: (row) => (
      <span className="text-[12px] text-muted-foreground tabular-nums">{row.priority_rank ?? 1}</span>
    ),
  },
};

const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);
const BOUND_FILTER_IDS: JobBound[] = ['import', 'export', 'domestic', 'transit'];

const JobPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [rows, setRows] = useState<FmsJob[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prioritySavingId, setPrioritySavingId] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedBounds, setSelectedBounds] = useState<JobBound[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilterClosing, setMobileFilterClosing] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>('bound');
  const [pendingBounds, setPendingBounds] = useState<JobBound[]>([]);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs(1, 500);
      setRows(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredRows = rows.filter((row) => {
    if (searchText) {
      const q = searchText.toLowerCase();
      const blob = [
        row.master_job_no,
        row.services,
        row.customers?.company_name,
        row.bound,
        row.workflow_status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (selectedBounds.length > 0) {
      if (!row.bound || !selectedBounds.includes(row.bound)) return false;
    }
    return true;
  });

  const stats = useMemo(() => {
    const boundCounts: Record<string, number> = { import: 0, export: 0, domestic: 0, transit: 0, unset: 0 };
    filteredRows.forEach((row) => {
      const b = row.bound;
      if (b && boundCounts[b] !== undefined) boundCounts[b] += 1;
      else boundCounts.unset += 1;
    });
    const pieData = [
      { name: 'Import', val: boundCounts.import, fill: '#0ea5e9' },
      { name: 'Export', val: boundCounts.export, fill: '#f59e0b' },
      { name: 'Domestic', val: boundCounts.domestic, fill: '#8b5cf6' },
      { name: 'Transit', val: boundCounts.transit, fill: '#64748b' },
      { name: 'Unset', val: boundCounts.unset, fill: '#cbd5e1' },
    ].filter((d) => d.val > 0);
    return { boundCounts, pieData };
  }, [filteredRows]);

  const toggleBound = (b: JobBound) => {
    setSelectedBounds((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length && filteredRows.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredRows.map((r) => r.id));
  };

  const handlePriorityChange = async (row: FmsJob, rank: number) => {
    const prev = row.priority_rank ?? 1;
    if (rank === prev) return;
    setPrioritySavingId(row.id);
    try {
      await jobService.updateJob(row.id, { priority_rank: rank });
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, priority_rank: rank } : r)));
      toastSuccess('Priority saved');
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : 'Could not update priority');
    } finally {
      setPrioritySavingId(null);
    }
  };

  const openBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => jobService.deleteJob(id)));
      toastSuccess(`${selectedIds.length} job(s) deleted`);
      setSelectedIds([]);
      setIsConfirmOpen(false);
      await fetchData();
    } catch (e: unknown) {
      toastError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = selectedBounds.length > 0;

  const closeMobileFilter = () => {
    setMobileFilterClosing(true);
    setTimeout(() => {
      setShowMobileFilter(false);
      setMobileFilterClosing(false);
    }, 280);
  };

  const openMobileFilter = () => {
    setPendingBounds(selectedBounds);
    setMobileExpandedSection('bound');
    setShowMobileFilter(true);
  };

  const applyMobileFilter = () => {
    setSelectedBounds(pendingBounds);
    closeMobileFilter();
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 mx-4 mt-4">
        <Briefcase className="mx-auto mb-2 opacity-40" />
        {error}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="flex items-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'list' ? 'bg-white text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
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
            activeTab === 'stats' ? 'bg-white text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BarChart2 size={14} />
          Statistics
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <button
              type="button"
              onClick={() => navigate('/shipping')}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={openMobileFilter}
              className={clsx(
                'p-2 rounded-xl border transition-all active:scale-95 relative',
                hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-muted-foreground',
              )}
            >
              <Filter size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/shipping/jobs/new')}
              className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20 active:scale-95"
              title="New job"
              aria-label="New job"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-50/30">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border p-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-50 rounded w-2/3" />
                </div>
              ))
            ) : filteredRows.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-muted-foreground italic bg-white rounded-2xl border border-dashed border-border mx-2">
                No jobs found
              </div>
            ) : (
              filteredRows.map((row) => (
                <div
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/shipping/jobs/${row.id}/edit`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/shipping/jobs/${row.id}/edit`)}
                  className="bg-white rounded-2xl border border-border p-4 shadow-sm active:border-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-primary uppercase opacity-70">{row.master_job_no}</span>
                      <p className="text-[14px] font-bold text-slate-900">{row.customers?.company_name || 'No customer'}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{row.services || '—'}</p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <ThreeStarRating
                        variant="inline"
                        value={row.priority_rank ?? 1}
                        disabled={prioritySavingId === row.id}
                        onChange={(rank) => void handlePriorityChange(row, rank)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block p-4 space-y-4 border-b border-border/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => navigate('/shipping')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search master no., customer, services..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={openBulkDelete}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                      Delete ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-xl text-[12px] font-bold border border-border hover:bg-slate-50 transition-all"
                    >
                      <X size={16} />
                      Clear
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => void fetchData()}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm"
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <ColumnSettings
                  columns={COLUMN_DEFS}
                  visibleColumns={visibleColumns}
                  columnOrder={columnOrder}
                  onVisibleColumnsChange={setVisibleColumns}
                  onColumnOrderChange={setColumnOrder}
                  defaultOrder={DEFAULT_COL_ORDER}
                />
                <button
                  type="button"
                  onClick={() => navigate('/shipping/jobs/new')}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <Plus size={16} />
                  New Job
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'bound' ? null : 'bound');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'bound' || selectedBounds.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Briefcase size={14} />
                  Bound
                  {selectedBounds.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedBounds.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'bound' ? '-rotate-90' : 'rotate-90')} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'bound'}
                  options={BOUND_FILTER_IDS.map((b) => ({
                    id: b,
                    label: BOUND_META[b].label,
                    count: rows.filter((r) => r.bound === b).length,
                  }))}
                  selected={selectedBounds}
                  onToggle={(id) => toggleBound(id as JobBound)}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
              {selectedBounds.length > 0 && (
                <button type="button" onClick={() => setSelectedBounds([])} className="text-[12px] font-bold text-muted-foreground hover:text-primary px-3">
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    {columnOrder
                      .filter((id) => visibleColumns.includes(id))
                      .map((key) => (
                        <th key={key} className={clsx(COLUMN_DEFS[key].thClass, 'border-b border-border/40')}>
                          {COLUMN_DEFS[key].label}
                        </th>
                      ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase border-b border-border/40 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={visibleColumns.length + 2} className="px-4 py-6 bg-slate-50/10 border-b border-border/40" />
                      </tr>
                    ))
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 2} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">
                        No jobs match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => navigate(`/shipping/jobs/${row.id}/edit`)}
                        className={clsx(
                          'hover:bg-slate-50/60 transition-colors cursor-pointer',
                          selectedIds.includes(row.id) && 'bg-primary/2',
                        )}
                      >
                        <td className="px-4 py-4 text-center border-r border-border/40" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="rounded border-border"
                          />
                        </td>
                        {columnOrder
                          .filter((id) => visibleColumns.includes(id))
                          .map((key) => (
                            <td key={key} className={COLUMN_DEFS[key].tdClass}>
                              {key === 'priority' ? (
                                <div className="flex justify-start" onClick={(e) => e.stopPropagation()}>
                                  <ThreeStarRating
                                    variant="inline"
                                    value={row.priority_rank ?? 1}
                                    disabled={prioritySavingId === row.id}
                                    onChange={(rank) => void handlePriorityChange(row, rank)}
                                  />
                                </div>
                              ) : (
                                COLUMN_DEFS[key].renderContent(row)
                              )}
                            </td>
                          ))}
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/shipping/jobs/${row.id}/edit`)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIds([row.id]);
                                setIsConfirmOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-[12px] font-medium text-slate-500">
                Showing <b>1</b> – <b>{filteredRows.length}</b> of <b>{filteredRows.length}</b>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 animate-in fade-in duration-300">
          <div className="hidden md:block p-4 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => navigate('/shipping')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold bg-white shadow-sm"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'bound2' ? null : 'bound2');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-bold',
                    activeDropdown === 'bound2' || selectedBounds.length > 0
                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Briefcase size={14} />
                  Bound
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'bound2' ? '-rotate-90' : 'rotate-90')} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'bound2'}
                  options={BOUND_FILTER_IDS.map((b) => ({
                    id: b,
                    label: BOUND_META[b].label,
                    count: rows.filter((r) => r.bound === b).length,
                  }))}
                  selected={selectedBounds}
                  onToggle={(id) => toggleBound(id as JobBound)}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setSelectedBounds([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-red-300 text-red-500 text-[12px] font-bold hover:bg-red-50"
                >
                  <X size={13} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-4 bg-slate-50/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Jobs', value: filteredRows.length, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                { label: 'Import', value: stats.boundCounts.import, color: 'text-sky-600', bg: 'bg-sky-500/10' },
                { label: 'Export', value: stats.boundCounts.export, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                { label: 'Unset bound', value: stats.boundCounts.unset, color: 'text-slate-600', bg: 'bg-slate-500/10' },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3">
                  <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.bg, c.color)}>
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">{c.label}</p>
                    <p className={clsx('text-lg font-black tabular-nums', c.color)}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 h-[280px] flex flex-col">
              <span className="text-[12px] font-bold text-primary uppercase mb-3">By bound</span>
              <div className="flex-1 min-h-0">
                {stats.pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-[13px] italic">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="val" nameKey="name">
                        {stats.pieData.map((e) => (
                          <Cell key={e.name} fill={e.fill} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showMobileFilter &&
        createPortal(
          <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end">
            <div
              className={clsx('absolute inset-0 bg-black/40 transition-opacity duration-300', mobileFilterClosing ? 'opacity-0' : 'opacity-100')}
              onClick={closeMobileFilter}
            />
            <div
              className={clsx(
                'relative bg-white rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl',
                mobileFilterClosing ? 'animate-out slide-out-to-bottom duration-300' : 'animate-in slide-in-from-bottom duration-300',
              )}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="text-[17px] font-bold">Filters</span>
                <button type="button" onClick={closeMobileFilter} className="p-1.5 text-muted-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => setMobileExpandedSection(mobileExpandedSection === 'bound' ? null : 'bound')}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <span className="text-[15px] font-bold">Bound</span>
                  <ChevronRight size={18} className={clsx('transition-transform', mobileExpandedSection === 'bound' && 'rotate-90')} />
                </button>
                {mobileExpandedSection === 'bound' && (
                  <div className="flex flex-wrap gap-2">
                    {BOUND_FILTER_IDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setPendingBounds((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
                        className={clsx(
                          'px-4 py-2 rounded-xl border text-[13px] font-bold',
                          pendingBounds.includes(b) ? 'bg-primary text-white border-primary' : 'bg-slate-50 border-slate-200',
                        )}
                      >
                        {BOUND_META[b].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border flex flex-col gap-2">
                <button type="button" onClick={() => setPendingBounds([])} className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-[14px] font-bold">
                  Clear All
                </button>
                <button type="button" onClick={applyMobileFilter} className="w-full py-4 rounded-2xl bg-primary text-white text-[15px] font-bold">
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        isProcessing={isDeleting}
        title="Delete job(s)"
        message={<>Delete {selectedIds.length} job record(s)? This cannot be undone.</>}
        confirmText="Delete"
      />
    </div>
  );
};

export default JobPage;
