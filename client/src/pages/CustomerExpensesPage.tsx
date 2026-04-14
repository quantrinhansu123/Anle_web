import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ChevronLeft,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  X,
  BarChart2,
  List,
  ChevronRight,
  RefreshCcw,
  Eye,
  Receipt,
  User as UserIcon,
  Building2,
  Briefcase,
  Upload,
  FileSpreadsheet,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { formatDate } from '../lib/utils';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import { useToastContext } from '../contexts/ToastContext';
import { customerExpenseService } from '../services/customerExpenseService';
import { employeeService, type Employee } from '../services/employeeService';
import { customerService, type Customer } from '../services/customerService';
import { jobService } from '../services/jobService';
import type { FmsJob } from './jobs/types';
import type {
  CustomerExpense,
  CustomerExpenseFormState,
  CustomerExpenseListQuery,
  CustomerExpenseStats,
  CustomerExpenseStatus,
  CustomerExpensePaidBy,
} from './customer-expenses/types';
import CustomerExpenseDialog from './customer-expenses/dialogs/CustomerExpenseDialog';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

const INITIAL_FORM_STATE: CustomerExpenseFormState = {
  expense_date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: 0,
  currency: 'VND',
  tax_amount: 0,
  status: 'draft',
  paid_by: 'employee_reimburse',
  employee_id: '',
  customer_id: '',
  job_id: '',
  supplier: '',
  category: '',
  bill_reference: '',
  account_label: '',
  company_name_snapshot: '',
  pay_for: '',
  service: '',
  notes: '',
  create_invoice: false,
};

const STATUS_LABELS: Record<CustomerExpenseStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_validation: 'Under validation',
  approved: 'Approved',
  completed: 'Completed',
  refused: 'Refused',
};

const PAID_BY_LABELS: Record<CustomerExpensePaidBy, string> = {
  employee_reimburse: 'Employee reimburse',
  company: 'Company',
  third_party: 'Third party',
};

const STATUS_ORDER: CustomerExpenseStatus[] = [
  'draft',
  'submitted',
  'under_validation',
  'approved',
  'completed',
  'refused',
];

function formatMoneyEn(n: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function lineTotal(r: CustomerExpense): number {
  return Number(r.amount) + Number(r.tax_amount || 0);
}

function companyCell(r: CustomerExpense): string {
  return r.customer?.company_name || r.company_name_snapshot || '—';
}

function statusBadgeClass(s: CustomerExpenseStatus): string {
  if (s === 'completed') return 'bg-emerald-600';
  if (s === 'refused') return 'bg-red-600';
  if (s === 'submitted' || s === 'under_validation') return 'bg-amber-600';
  if (s === 'approved') return 'bg-blue-600';
  return 'bg-slate-500';
}

type ColDef = {
  label: string;
  thClass: string;
  tdClass: string;
  renderContent: (r: CustomerExpense) => React.ReactNode;
};

const COLUMN_DEFS: Record<string, ColDef> = {
  expense_date: {
    label: 'Date',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-medium tabular-nums',
    renderContent: (r) => formatDate(r.expense_date),
  },
  description: {
    label: 'Description',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[200px] border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] font-medium max-w-[280px] truncate',
    renderContent: (r) => r.description,
  },
  job: {
    label: 'Job',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-bold text-primary',
    renderContent: (r) => r.job?.master_job_no || '—',
  },
  employee: {
    label: 'Employee',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[140px] border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] font-bold',
    renderContent: (r) => r.employee?.full_name || '—',
  },
  paid_by: {
    label: 'Paid by',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px]',
    renderContent: (r) => PAID_BY_LABELS[r.paid_by],
  },
  company: {
    label: 'Company',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[160px] border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px]',
    renderContent: (r) => companyCell(r),
  },
  total: {
    label: 'Total',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 text-right border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-right font-black tabular-nums text-[13px]',
    renderContent: (r) => `${formatMoneyEn(lineTotal(r))} ${r.currency}`,
  },
  status: {
    label: 'Status',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-44 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (r) => (
      <span
        className={clsx(
          'px-2.5 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap inline-block text-center min-w-[100px]',
          statusBadgeClass(r.status),
        )}
      >
        {STATUS_LABELS[r.status]}
      </span>
    ),
  },
};

const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const CustomerExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [rows, setRows] = useState<CustomerExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [stats, setStats] = useState<CustomerExpenseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [headlineStats, setHeadlineStats] = useState<CustomerExpenseStats | null>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [formState, setFormState] = useState<CustomerExpenseFormState>(INITIAL_FORM_STATE);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
  const [jobs, setJobs] = useState<FmsJob[]>([]);
  const [jobOptions, setJobOptions] = useState<{ value: string; label: string }[]>([]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({
    type: 'single',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilterClosing, setMobileFilterClosing] = useState(false);
  const [pendingStatuses, setPendingStatuses] = useState<string[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<string[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<string[]>([]);
  const [pendingJobs, setPendingJobs] = useState<string[]>([]);

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

  const listQuery: CustomerExpenseListQuery = useMemo(() => {
    const base: CustomerExpenseListQuery = {
      page,
      limit,
      status: selectedStatuses.length ? selectedStatuses : undefined,
      customer_id: selectedCustomers.length ? selectedCustomers : undefined,
      employee_id: selectedEmployees.length ? selectedEmployees : undefined,
      job_id: selectedJobs.length ? selectedJobs : undefined,
    };
    if (searchText.trim()) {
      base.search = searchText.trim();
    }
    return base;
  }, [page, searchText, selectedStatuses, selectedCustomers, selectedEmployees, selectedJobs]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { items, pagination } = await customerExpenseService.getList(listQuery);
      setRows(items);
      setTotal(pagination.total);
    } catch (err) {
      console.error(err);
      error(err instanceof Error ? err.message : 'Failed to load list');
    } finally {
      setLoading(false);
    }
  }, [listQuery, error]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const fetchHeadlineStats = useCallback(async () => {
    try {
      const s = await customerExpenseService.getStats();
      setHeadlineStats(s);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void fetchHeadlineStats();
  }, [fetchHeadlineStats]);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await employeeService.getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
      setEmployeeOptions(
        (Array.isArray(data) ? data : []).map((e) => ({
          value: e.id,
          label: e.full_name + (e.department ? ` — ${e.department}` : ''),
        })),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
      setCustomerOptions(
        (Array.isArray(data) ? data : []).map((c) => ({
          value: c.id,
          label: c.company_name,
        })),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await jobService.getJobs(1, 200);
      setJobs(Array.isArray(data) ? data : []);
      setJobOptions(
        (Array.isArray(data) ? data : []).map((j) => ({
          value: j.id,
          label: j.master_job_no,
        })),
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
    void fetchCustomers();
    void fetchJobs();
  }, [fetchEmployees, fetchCustomers, fetchJobs]);

  useEffect(() => {
    if (activeTab !== 'stats') return;
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const s = await customerExpenseService.getStats();
        if (!cancelled) setStats(s);
      } catch (err) {
        console.error(err);
        if (!cancelled) error(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, error]);

  useEffect(() => {
    setPage(1);
  }, [searchText, selectedStatuses, selectedCustomers, selectedEmployees, selectedJobs]);

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedCustomers.length > 0 ||
    selectedEmployees.length > 0 ||
    selectedJobs.length > 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length && rows.length > 0) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const rowToForm = (r: CustomerExpense): CustomerExpenseFormState => ({
    id: r.id,
    expense_date: r.expense_date?.slice(0, 10) || '',
    description: r.description,
    amount: Number(r.amount),
    currency: r.currency || 'VND',
    tax_amount: Number(r.tax_amount || 0),
    status: r.status,
    paid_by: r.paid_by,
    employee_id: r.employee_id,
    customer_id: r.customer_id || '',
    job_id: r.job_id || '',
    supplier: r.supplier || '',
    category: r.category || '',
    bill_reference: r.bill_reference || '',
    account_label: r.account_label || '',
    company_name_snapshot: r.company_name_snapshot || '',
    pay_for: r.pay_for || '',
    service: r.service || '',
    notes: r.notes || '',
    create_invoice: !!r.create_invoice,
  });

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (r: CustomerExpense) => {
    setFormState(rowToForm(r));
    setIsEditMode(true);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (r: CustomerExpense) => {
    setFormState(rowToForm(r));
    setIsEditMode(false);
    setIsDetailMode(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDialogOpen(false);
      setIsClosing(false);
    }, 350);
  };

  const handleSave = async () => {
    try {
      if (!formState.employee_id) {
        error('Please select an employee');
        return;
      }
      if (!formState.description.trim()) {
        error('Description is required');
        return;
      }
      if (!formState.expense_date) {
        error('Please set expense date');
        return;
      }
      if (!formState.amount || formState.amount <= 0) {
        error('Amount must be greater than 0');
        return;
      }
      if (isEditMode && formState.id) {
        await customerExpenseService.update(formState.id, formState);
        success('Expense updated successfully');
      } else {
        await customerExpenseService.create(formState);
        success('Expense created successfully');
      }
      handleCloseDialog();
      void fetchList();
      void fetchHeadlineStats();
      if (activeTab === 'stats') {
        const s = await customerExpenseService.getStats();
        setStats(s);
      }
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmAction({ type: 'single', id });
    setIsConfirmOpen(true);
  };

  const handleBulkDeleteClick = () => {
    setConfirmAction({ type: 'bulk' });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (confirmAction.type === 'single' && confirmAction.id) {
        await customerExpenseService.delete(confirmAction.id);
        success('Deleted successfully');
        setSelectedIds((prev) => prev.filter((i) => i !== confirmAction.id));
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedIds.map((id) => customerExpenseService.delete(id)));
        success(`Deleted ${selectedIds.length} expense(s)`);
        setSelectedIds([]);
      }
      setIsConfirmOpen(false);
      void fetchList();
      void fetchHeadlineStats();
    } catch (err: unknown) {
      error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeMobileFilter = () => {
    setMobileFilterClosing(true);
    setTimeout(() => {
      setShowMobileFilter(false);
      setMobileFilterClosing(false);
    }, 280);
  };

  const openMobileFilter = () => {
    setPendingStatuses(selectedStatuses);
    setPendingCustomers(selectedCustomers);
    setPendingEmployees(selectedEmployees);
    setPendingJobs(selectedJobs);
    setShowMobileFilter(true);
  };

  const applyMobileFilter = () => {
    setSelectedStatuses(pendingStatuses);
    setSelectedCustomers(pendingCustomers);
    setSelectedEmployees(pendingEmployees);
    setSelectedJobs(pendingJobs);
    closeMobileFilter();
  };

  const statusChartData =
    stats?.byStatus.map((b) => ({
      name: STATUS_LABELS[b.status],
      value: b.count,
      amount: b.totalAmount,
    })) ?? [];

  const monthChartData =
    stats?.byMonth.map((m) => ({
      name: m.month,
      totalAmount: m.totalAmount,
      count: m.count,
    })) ?? [];

  const stubAction = () => info('Coming soon');

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

      {activeTab === 'list' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <button
              type="button"
              onClick={() => navigate('/finance')}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
              />
            </div>
            <button
              type="button"
              onClick={openMobileFilter}
              className={clsx(
                'p-2 rounded-xl border relative',
                hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-muted-foreground',
              )}
            >
              <Filter size={18} />
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {loading ? (
              <div className="py-16 text-center animate-pulse text-muted-foreground italic">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-muted-foreground italic">No data</div>
            ) : (
              rows.map((r) => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenDetail(r)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenDetail(r)}
                  className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[12px] font-bold text-primary">{formatDate(r.expense_date)}</span>
                      <p className="text-[14px] font-bold leading-tight line-clamp-2">{r.description}</p>
                    </div>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[9px] font-bold text-white shrink-0',
                        statusBadgeClass(r.status),
                      )}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground flex justify-between">
                    <span>{r.employee?.full_name || '—'}</span>
                    <span className="font-bold text-foreground">
                      {formatMoneyEn(lineTotal(r))} {r.currency}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block p-4 space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => navigate('/finance')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {selectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <Trash2 size={16} />
                      Delete Selected ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-xl text-[12px] font-bold border border-border hover:bg-slate-50 transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <X size={16} />
                      Clear
                    </button>
                  </>
                )}
                <button
                  type="button"
                  title="Coming soon"
                  onClick={stubAction}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-white text-[12px] font-bold text-muted-foreground hover:bg-muted"
                >
                  <Upload size={16} />
                  Upload
                </button>
                <button
                  type="button"
                  title="Coming soon"
                  onClick={stubAction}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-white text-[12px] font-bold text-muted-foreground hover:bg-muted"
                >
                  <FileSpreadsheet size={16} />
                  Create report
                </button>
                <button
                  type="button"
                  onClick={() => void fetchList()}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
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
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all font-inter"
                >
                  <Plus size={16} />
                  New
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
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'status' || selectedStatuses.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Receipt
                    size={14}
                    className={clsx(
                      activeDropdown === 'status' || selectedStatuses.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
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
                  options={STATUS_ORDER.map((k) => ({
                    id: k,
                    label: STATUS_LABELS[k],
                    count: rows.filter((r) => r.status === k).length,
                  }))}
                  selected={selectedStatuses}
                  onToggle={(id) =>
                    setSelectedStatuses((prev) =>
                      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
                    setActiveDropdown(activeDropdown === 'customer' ? null : 'customer');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'customer' || selectedCustomers.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Building2
                    size={14}
                    className={clsx(
                      activeDropdown === 'customer' || selectedCustomers.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
                  Customer
                  {selectedCustomers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedCustomers.length}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={clsx(
                      'transition-transform ml-1 opacity-40',
                      activeDropdown === 'customer' ? '-rotate-90' : 'rotate-90',
                    )}
                  />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'customer'}
                  options={customers.map((c) => ({
                    id: c.id,
                    label: c.company_name,
                  }))}
                  selected={selectedCustomers}
                  onToggle={(id) =>
                    setSelectedCustomers((prev) =>
                      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
                    setActiveDropdown(activeDropdown === 'employee' ? null : 'employee');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'employee' || selectedEmployees.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <UserIcon
                    size={14}
                    className={clsx(
                      activeDropdown === 'employee' || selectedEmployees.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
                  Employee
                  {selectedEmployees.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedEmployees.length}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={clsx(
                      'transition-transform ml-1 opacity-40',
                      activeDropdown === 'employee' ? '-rotate-90' : 'rotate-90',
                    )}
                  />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'employee'}
                  options={employees.map((e) => ({
                    id: e.id,
                    label: e.full_name,
                  }))}
                  selected={selectedEmployees}
                  onToggle={(id) =>
                    setSelectedEmployees((prev) =>
                      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'job' || selectedJobs.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Briefcase
                    size={14}
                    className={clsx(
                      activeDropdown === 'job' || selectedJobs.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
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
                  options={jobs.map((j) => ({
                    id: j.id,
                    label: j.master_job_no,
                  }))}
                  selected={selectedJobs}
                  onToggle={(id) =>
                    setSelectedJobs((prev) =>
                      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
                    )
                  }
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
            </div>

            {headlineStats && (
              <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: 'submitted',
                    label: 'Submitted',
                    sub: 'Waiting for report',
                    bucket: headlineStats.summary.submitted,
                  },
                  {
                    key: 'under',
                    label: 'Under validation',
                    sub: 'In review',
                    bucket: headlineStats.summary.underValidation,
                  },
                  {
                    key: 'done',
                    label: 'Completed',
                    sub: 'Reimbursed',
                    bucket: headlineStats.summary.completed,
                  },
                ].map((card) => (
                  <div
                    key={card.key}
                    className="rounded-2xl border border-border bg-slate-50/80 px-4 py-3 flex flex-col gap-1 shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      {card.label}
                    </span>
                    <span className="text-[11px] text-slate-500">{card.sub}</span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">
                      {formatMoneyEn(card.bucket.totalAmount)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{card.bucket.count} line(s)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20 max-h-[calc(100vh-380px)]">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === rows.length && rows.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    {columnOrder
                      .filter((id) => visibleColumns.includes(id))
                      .map((key) => (
                        <th key={key} className={COLUMN_DEFS[key].thClass + ' border-b border-border/40'}>
                          {COLUMN_DEFS[key].label}
                        </th>
                      ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td
                            colSpan={visibleColumns.length + 2}
                            className="px-4 py-6 bg-slate-50/10 border-b border-border/40"
                          />
                        </tr>
                      ))
                    : rows.length === 0
                      ? (
                          <tr>
                            <td
                              colSpan={visibleColumns.length + 2}
                              className="px-4 py-20 text-center italic text-muted-foreground opacity-60"
                            >
                              No records found.
                            </td>
                          </tr>
                        )
                      : (
                          rows.map((r) => (
                            <tr
                              key={r.id}
                              onClick={() => handleOpenDetail(r)}
                              className={clsx(
                                'hover:bg-slate-50/60 transition-colors group cursor-pointer',
                                selectedIds.includes(r.id) && 'bg-primary/2',
                              )}
                            >
                              <td
                                className="px-4 py-4 text-center border-r border-border/40"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(r.id)}
                                  onChange={() => toggleSelect(r.id)}
                                  className="rounded border-border"
                                />
                              </td>
                              {columnOrder
                                .filter((id) => visibleColumns.includes(id))
                                .map((key) => (
                                  <td key={key} className={COLUMN_DEFS[key].tdClass}>
                                    {COLUMN_DEFS[key].renderContent(r)}
                                  </td>
                                ))}
                              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDetail(r)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                    title="View"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(r)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteClick(r.id, e)}
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
                Showing <b>{total === 0 ? 0 : (page - 1) * limit + 1}</b> –{' '}
                <b>{Math.min(page * limit, total)}</b> of <b>{total}</b>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 text-[12px] font-bold text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {showMobileFilter && (
            <div
              className={clsx(
                'md:hidden fixed inset-0 z-100 flex flex-col justify-end bg-black/40 transition-opacity duration-300',
                mobileFilterClosing ? 'opacity-0' : 'opacity-100',
              )}
            >
              <div
                className={clsx(
                  'bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto transition-transform duration-300',
                  mobileFilterClosing ? 'translate-y-full' : 'translate-y-0',
                )}
              >
                <p className="text-[12px] font-bold mb-3">Status</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {STATUS_ORDER.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        setPendingStatuses((prev) =>
                          prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border',
                        pendingStatuses.includes(k)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {STATUS_LABELS[k]}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] font-bold mb-3">Customer</p>
                <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setPendingCustomers((prev) =>
                          prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border max-w-full truncate',
                        pendingCustomers.includes(c.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {c.company_name}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] font-bold mb-3">Employee</p>
                <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                  {employees.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() =>
                        setPendingEmployees((prev) =>
                          prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border',
                        pendingEmployees.includes(e.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {e.full_name}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] font-bold mb-3">Job</p>
                <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                  {jobs.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() =>
                        setPendingJobs((prev) =>
                          prev.includes(j.id) ? prev.filter((x) => x !== j.id) : [...prev, j.id],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border',
                        pendingJobs.includes(j.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {j.master_job_no}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeMobileFilter}
                    className="flex-1 py-2 rounded-xl border border-border font-bold text-[12px]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={applyMobileFilter}
                    className="flex-1 py-2 rounded-xl bg-primary text-white font-bold text-[12px]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 animate-in fade-in duration-300">
          {statsLoading || !stats ? (
            <div className="py-20 text-center text-muted-foreground italic">Loading statistics...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total expenses',
                    val: stats.totalCount,
                    icon: List,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Grand total (amount + tax)',
                    val: formatMoneyEn(stats.grandTotalAmount),
                    icon: Receipt,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    label: 'Submitted (count)',
                    val: stats.summary.submitted.count,
                    icon: BarChart2,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                  {
                    label: 'Completed (count)',
                    val: stats.summary.completed.count,
                    icon: PieChartIcon,
                    color: 'text-orange-600',
                    bg: 'bg-orange-50',
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3"
                  >
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        card.bg,
                        card.color,
                      )}
                    >
                      <card.icon size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1 truncate">
                        {card.label}
                      </span>
                      <span className="text-xl font-black text-slate-900 tabular-nums truncate">{card.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6 h-[280px] flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-primary font-bold text-[12px] uppercase">
                    <PieChartIcon size={16} className="shrink-0" />
                    <span>By status (count)</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={72}
                          paddingAngle={2}
                        >
                          {statusChartData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={['#64748b', '#f59e0b', '#eab308', '#3b82f6', '#10b981', '#ef4444'][index % 6]}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-border shadow-sm p-6 h-[280px] flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-primary font-bold text-[12px] uppercase">
                    <BarChart2 size={16} className="shrink-0" />
                    <span>By status (amount)</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-border shadow-sm p-6 h-[300px] flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-primary font-bold text-[12px] uppercase">
                  <BarChart2 size={16} />
                  <span>By month (total amount)</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line type="monotone" dataKey="totalAmount" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <CustomerExpenseDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        isDetailMode={isDetailMode}
        onClose={handleCloseDialog}
        onEdit={() => {
          setIsEditMode(true);
          setIsDetailMode(false);
        }}
        formState={formState}
        setFormField={(key, val) => setFormState((prev) => ({ ...prev, [key]: val }))}
        employeeOptions={employeeOptions}
        customerOptions={customerOptions}
        jobOptions={jobOptions}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isProcessing={isDeleting}
        message={
          confirmAction.type === 'bulk' ? (
            <>Delete {selectedIds.length} selected expense(s)? This cannot be undone.</>
          ) : (
            <>Delete this customer expense?</>
          )
        }
      />
    </div>
  );
};

export default CustomerExpensesPage;
