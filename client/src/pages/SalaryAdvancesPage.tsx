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
  Banknote,
  Users,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { formatDate } from '../lib/utils';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import { useToastContext } from '../contexts/ToastContext';
import { salaryAdvanceService } from '../services/salaryAdvanceService';
import { employeeService, type Employee } from '../services/employeeService';
import type {
  SalaryAdvanceRequest,
  SalaryAdvanceFormState,
  SalaryAdvanceStats,
  SalaryAdvanceListQuery,
  ApprovalStatus,
  PaymentStatus,
} from './salary-advances/types';
import SalaryAdvanceDialog from './salary-advances/dialogs/SalaryAdvanceDialog';
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
} from 'recharts';

const INITIAL_FORM_STATE: SalaryAdvanceFormState = {
  employee_id: '',
  advance_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  approval_status: 'pending',
  payment_status: 'unpaid',
  notes: '',
};

const approvalLabels: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  reconciled: 'Reconciled',
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

function formatMoneyEn(n: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function rowTone(status: ApprovalStatus): string {
  if (status === 'approved') return 'text-emerald-800';
  if (status === 'pending') return 'text-amber-800';
  return 'text-slate-700';
}

type ColDef = {
  label: string;
  thClass: string;
  tdClass: string;
  renderContent: (r: SalaryAdvanceRequest) => React.ReactNode;
};

const COLUMN_DEFS: Record<string, ColDef> = {
  reference: {
    label: 'Reference',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-bold text-primary',
    renderContent: (r) => <span>{r.reference_code}</span>,
  },
  advance_date: {
    label: 'Advance date',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-medium tabular-nums',
    renderContent: (r) => formatDate(r.advance_date),
  },
  employee: {
    label: 'Employee',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[160px] border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] font-bold',
    renderContent: (r) => r.employee?.full_name || '—',
  },
  position: {
    label: 'Position',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-48 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px]',
    renderContent: (r) => r.employee?.position || '—',
  },
  department: {
    label: 'Department',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight min-w-[180px] border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px]',
    renderContent: (r) => r.employee?.department || '—',
  },
  amount: {
    label: 'Amount',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 text-right border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-right font-black tabular-nums text-[13px]',
    renderContent: (r) => formatMoneyEn(Number(r.amount)),
  },
  approval_status: {
    label: 'Status',
    thClass:
      'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-36 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-semibold',
    renderContent: (r) => (
      <span className={clsx(rowTone(r.approval_status))}>{approvalLabels[r.approval_status]}</span>
    ),
  },
  payment_status: {
    label: 'Payment',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-44',
    tdClass: 'px-4 py-4',
    renderContent: (r) => (
      <span
        className={clsx(
          'px-2.5 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap inline-block text-center min-w-[100px]',
          r.payment_status === 'paid' ? 'bg-emerald-600' : 'bg-red-600',
        )}
      >
        {paymentLabels[r.payment_status]}
      </span>
    ),
  },
};

const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const SalaryAdvancesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [rows, setRows] = useState<SalaryAdvanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [stats, setStats] = useState<SalaryAdvanceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [formState, setFormState] = useState<SalaryAdvanceFormState>(INITIAL_FORM_STATE);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({
    type: 'single',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilterClosing, setMobileFilterClosing] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<string[]>([]);
  const [pendingPayments, setPendingPayments] = useState<string[]>([]);
  const [pendingDepartments, setPendingDepartments] = useState<string[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<string[]>([]);

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

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      if (e.department?.trim()) set.add(e.department.trim());
    }
    return Array.from(set).sort();
  }, [employees]);

  const listQuery: SalaryAdvanceListQuery = useMemo(() => {
    const base: SalaryAdvanceListQuery = {
      page,
      limit,
      approval_status: selectedApprovals.length ? selectedApprovals : undefined,
      payment_status: selectedPayments.length ? selectedPayments : undefined,
      department: selectedDepartments.length ? selectedDepartments : undefined,
      employee_ids: selectedEmployees.length ? selectedEmployees : undefined,
    };
    if (searchText.trim()) {
      base.search = searchText.trim();
    }
    return base;
  }, [
    page,
    searchText,
    selectedApprovals,
    selectedPayments,
    selectedDepartments,
    selectedEmployees,
  ]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { items, pagination } = await salaryAdvanceService.getList(listQuery);
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

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab !== 'stats') return;
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const s = await salaryAdvanceService.getStats();
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
  }, [searchText, selectedApprovals, selectedPayments, selectedDepartments, selectedEmployees]);

  const hasActiveFilters =
    selectedApprovals.length > 0 ||
    selectedPayments.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedEmployees.length > 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length && rows.length > 0) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (r: SalaryAdvanceRequest) => {
    setFormState({
      id: r.id,
      employee_id: r.employee_id,
      advance_date: r.advance_date?.slice(0, 10) || '',
      amount: Number(r.amount),
      approval_status: r.approval_status,
      payment_status: r.payment_status,
      notes: r.notes || '',
    });
    setIsEditMode(true);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (r: SalaryAdvanceRequest) => {
    handleOpenEdit(r);
    setIsEditMode(false);
    setIsDetailMode(true);
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
      if (!formState.advance_date) {
        error('Please select an advance date');
        return;
      }
      if (!formState.amount || formState.amount <= 0) {
        error('Amount must be greater than 0');
        return;
      }
      if (isEditMode && formState.id) {
        await salaryAdvanceService.update(formState.id, formState);
        success('Request updated successfully');
      } else {
        await salaryAdvanceService.create(formState);
        success('Request created successfully');
      }
      handleCloseDialog();
      void fetchList();
      if (activeTab === 'stats') {
        const s = await salaryAdvanceService.getStats();
        setStats(s);
      }
    } catch (err: any) {
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
        await salaryAdvanceService.delete(confirmAction.id);
        success('Deleted successfully');
        setSelectedIds((prev) => prev.filter((i) => i !== confirmAction.id));
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedIds.map((id) => salaryAdvanceService.delete(id)));
        success(`Deleted ${selectedIds.length} request(s)`);
        setSelectedIds([]);
      }
      setIsConfirmOpen(false);
      void fetchList();
    } catch (err: any) {
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
    setPendingApprovals(selectedApprovals);
    setPendingPayments(selectedPayments);
    setPendingDepartments(selectedDepartments);
    setPendingEmployees(selectedEmployees);
    setShowMobileFilter(true);
  };

  const applyMobileFilter = () => {
    setSelectedApprovals(pendingApprovals);
    setSelectedPayments(pendingPayments);
    setSelectedDepartments(pendingDepartments);
    setSelectedEmployees(pendingEmployees);
    closeMobileFilter();
  };

  const approvalChartData = stats
    ? (['pending', 'approved', 'reconciled'] as ApprovalStatus[]).map((k) => ({
        name: approvalLabels[k],
        value: stats.byApproval[k],
      }))
    : [];

  const paymentChartData = stats
    ? (['unpaid', 'paid'] as PaymentStatus[]).map((k) => ({
        name: paymentLabels[k],
        value: stats.byPayment[k],
      }))
    : [];

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
                placeholder="Search requests..."
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
                      <span className="text-[12px] font-bold text-primary">{r.reference_code}</span>
                      <p className={clsx('text-[14px] font-bold leading-tight', rowTone(r.approval_status))}>
                        {r.employee?.full_name || '—'}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[9px] font-bold text-white shrink-0',
                        r.payment_status === 'paid' ? 'bg-emerald-600' : 'bg-red-600',
                      )}
                    >
                      {paymentLabels[r.payment_status]}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground flex justify-between">
                    <span>{formatDate(r.advance_date)}</span>
                    <span className="font-bold text-foreground">{formatMoneyEn(Number(r.amount))}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => navigate('/finance')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  New Request
                </button>
              </div>
            </div>

            <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'dept' ? null : 'dept');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'dept' || selectedDepartments.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Briefcase
                    size={14}
                    className={clsx(
                      activeDropdown === 'dept' || selectedDepartments.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
                  Department
                  {selectedDepartments.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedDepartments.length}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={clsx(
                      'transition-transform ml-1 opacity-40',
                      activeDropdown === 'dept' ? '-rotate-90' : 'rotate-90',
                    )}
                  />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'dept'}
                  options={departmentOptions.map((d) => ({
                    id: d,
                    label: d,
                    count: employees.filter((e) => e.department === d).length,
                  }))}
                  selected={selectedDepartments}
                  onToggle={(id) =>
                    setSelectedDepartments((prev) =>
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
                    setActiveDropdown(activeDropdown === 'approval' ? null : 'approval');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'approval' || selectedApprovals.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <CheckCircle2
                    size={14}
                    className={clsx(
                      activeDropdown === 'approval' || selectedApprovals.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
                  Approval
                  {selectedApprovals.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedApprovals.length}
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    className={clsx(
                      'transition-transform ml-1 opacity-40',
                      activeDropdown === 'approval' ? '-rotate-90' : 'rotate-90',
                    )}
                  />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'approval'}
                  options={(['pending', 'approved', 'reconciled'] as ApprovalStatus[]).map((k) => ({
                    id: k,
                    label: approvalLabels[k],
                    count: rows.filter((r) => r.approval_status === k).length,
                  }))}
                  selected={selectedApprovals}
                  onToggle={(id) =>
                    setSelectedApprovals((prev) =>
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
                    setActiveDropdown(activeDropdown === 'payment' ? null : 'payment');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[12px] font-bold shadow-sm',
                    activeDropdown === 'payment' || selectedPayments.length > 0
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Banknote
                    size={14}
                    className={clsx(
                      activeDropdown === 'payment' || selectedPayments.length > 0
                        ? 'text-primary'
                        : 'text-muted-foreground/50',
                    )}
                  />
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
                      activeDropdown === 'payment' ? '-rotate-90' : 'rotate-90',
                    )}
                  />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'payment'}
                  options={(['unpaid', 'paid'] as PaymentStatus[]).map((k) => ({
                    id: k,
                    label: paymentLabels[k],
                    count: rows.filter((r) => r.payment_status === k).length,
                  }))}
                  selected={selectedPayments}
                  onToggle={(id) =>
                    setSelectedPayments((prev) =>
                      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
                    )
                  }
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20 max-h-[calc(100vh-320px)]">
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
                                rowTone(r.approval_status),
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
                <p className="text-[12px] font-bold mb-3">Department</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {departmentOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setPendingDepartments((prev) =>
                          prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border max-w-full truncate',
                        pendingDepartments.includes(d)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {d}
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
                <p className="text-[12px] font-bold mb-3">Approval</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['pending', 'approved', 'reconciled'] as ApprovalStatus[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        setPendingApprovals((prev) =>
                          prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border',
                        pendingApprovals.includes(k)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {approvalLabels[k]}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] font-bold mb-3">Payment</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['unpaid', 'paid'] as PaymentStatus[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        setPendingPayments((prev) =>
                          prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                        )
                      }
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-[11px] font-bold border',
                        pendingPayments.includes(k)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border',
                      )}
                    >
                      {paymentLabels[k]}
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
                    label: 'Total requests',
                    val: stats.total,
                    icon: List,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Total amount',
                    val: formatMoneyEn(stats.totalAmount),
                    icon: Banknote,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    label: 'Pending approval',
                    val: stats.byApproval.pending,
                    icon: Clock,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                  {
                    label: 'Unpaid',
                    val: stats.byPayment.unpaid,
                    icon: Users,
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
                    <span>By approval status</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={approvalChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={72}
                          paddingAngle={4}
                        >
                          {approvalChartData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={['#f59e0b', '#10b981', '#64748b'][index % 3]}
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
                    <span>By payment status</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <SalaryAdvanceDialog
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
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isProcessing={isDeleting}
        message={
          confirmAction.type === 'bulk' ? (
            <>
              Delete {selectedIds.length} selected request(s)? This cannot be undone.
            </>
          ) : (
            <>Delete this salary advance request?</>
          )
        }
      />
    </div>
  );
};

export default SalaryAdvancesPage;
