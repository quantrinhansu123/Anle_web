import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, Search, Plus, Filter, 
  Edit, Trash2, X, BarChart2, List,
  ChevronRight, Users, 
  Briefcase, MapPin, RefreshCcw,
  TrendingUp, CheckCircle2, Clock, Phone, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { employeeService, type Employee } from '../services/employeeService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import EmployeeDialog from './employees/dialogs/EmployeeDialog';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useToastContext } from '../contexts/ToastContext';

// --- CONFIGURATION ---
const INITIAL_FORM_STATE: Partial<Employee> = {
  full_name: '',
  department: '',
  position: '',
  email: '',
  phone: '',
  address: '',
  avatar_url: ''
};

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (e: Employee) => React.ReactNode };

const COLUMN_DEFS: Record<string, ColDef> = {
  employee: {
    label: 'Employee',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-64 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (e) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
          {e.avatar_url ? (
            <img src={e.avatar_url} alt={e.full_name} className="w-full h-full object-cover" />
          ) : (
            <Users size={14} className="text-slate-400" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-foreground">{e.full_name}</span>
          <span className="text-[11px] text-muted-foreground opacity-70">{e.email}</span>
        </div>
      </div>
    )
  },
  department: {
    label: 'Department',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (e) => (
      <div className="flex items-center gap-2">
        <Briefcase size={12} className="text-primary/60" />
        <span className="text-[12px] font-medium text-slate-600">{e.department || '—'}</span>
      </div>
    )
  },
  position: {
    label: 'Position',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (e) => <span className="text-[12px] font-medium text-slate-600">{e.position || '—'}</span>
  },
  contact: {
    label: 'Contact',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-48 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (e) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Phone size={10} />
          <span>{e.phone || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <MapPin size={10} />
          <span className="truncate max-w-[150px]">{e.address || '—'}</span>
        </div>
      </div>
    )
  },
  status: {
    label: 'Status',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32',
    tdClass: 'px-4 py-4',
    renderContent: () => <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap block text-center bg-emerald-50 text-emerald-600 border-emerald-200">Active</span>
  }
};

const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchText, setSearchText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Filters
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

  // Mobile Filter sheet
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<Partial<Employee>>(INITIAL_FORM_STATE);

  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  const setFormField = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (employee: Employee) => {
    setFormState(employee);
    setIsEditMode(true);
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
      if (!formState.full_name || !formState.email) {
        error('Please fill in required fields (Name and Email).');
        return;
      }

      // Sanitize DTO to remove non-column fields/relations
      const { id: _id, shipments, contracts, created_at, ...updateDto } = formState as any;

      if (isEditMode && formState.id) {
        await employeeService.updateEmployee(formState.id, updateDto);
      } else {
        await employeeService.createEmployee(updateDto as any);
      }

      handleCloseDialog();
      fetchData();
      success(isEditMode ? 'Employee updated successfully' : 'Employee created successfully');
    } catch (err) {
      console.error('Failed to save employee:', err);
      error('Failed to save employee. Please try again.');
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
        await employeeService.deleteEmployee(confirmAction.id);
        success('Employee deleted successfully');
        if (selectedEmployees.includes(confirmAction.id)) {
          setSelectedEmployees(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedEmployees.map(id => employeeService.deleteEmployee(id)));
        success(`${selectedEmployees.length} employees deleted successfully`);
        setSelectedEmployees([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
      error('Failed to delete employee(s)');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployees = employees.filter(e => {
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesText = 
        e.full_name.toLowerCase().includes(search) || 
        e.email.toLowerCase().includes(search) ||
        (e.department && e.department.toLowerCase().includes(search)) ||
        (e.position && e.position.toLowerCase().includes(search));
      if (!matchesText) return false;
    }

    if (selectedDepartments.length > 0 && e.department && !selectedDepartments.includes(e.department)) return false;
    if (selectedPositions.length > 0 && e.position && !selectedPositions.includes(e.position)) return false;

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) setSelectedEmployees([]);
    else setSelectedEmployees(filteredEmployees.map(e => e.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[];
  const positions = Array.from(new Set(employees.map(e => e.position).filter(Boolean))) as string[];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      {/* Sidebar Style Tabs */}
      <div className="flex items-center gap-1 mb-4">
        <button 
          onClick={() => setActiveTab('list')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
            activeTab === 'list' ? "bg-white text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List size={14} />
          Employee List
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
            activeTab === 'stats' ? "bg-white text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart2 size={14} />
          Organization Stats
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          {/* DESKTOP TOOLBAR */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => navigate('/internal')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"><ChevronLeft size={16} />Back</button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input type="text" placeholder="Search employees..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchData} 
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
                {selectedEmployees.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <button 
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <Trash2 size={13} />
                      Delete ({selectedEmployees.length})
                    </button>
                    <button 
                      onClick={() => setSelectedEmployees([])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-600 bg-white border border-border hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <X size={14} />
                      Clear
                    </button>
                    <div className="h-4 w-px bg-border mx-1" />
                  </div>
                )}
                <button 
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all font-inter"
                >
                  <Plus size={16} />
                  New Employee
                </button>
              </div>
            </div>

            {/* Secondary Filters */}
            <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button 
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'department' ? null : 'department');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'department' || selectedDepartments.length > 0 
                      ? "bg-primary/5 border-primary text-primary" 
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Briefcase size={14} className={clsx(activeDropdown === 'department' || selectedDepartments.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Department
                  {selectedDepartments.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedDepartments.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'department' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown 
                  isOpen={activeDropdown === 'department'}
                  options={departments.map(d => ({ 
                    id: d, 
                    label: d,
                    count: employees.filter(e => e.department === d).length
                  }))}
                  selected={selectedDepartments}
                  onToggle={(id) => setSelectedDepartments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button 
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'position' ? null : 'position');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'position' || selectedPositions.length > 0 
                      ? "bg-primary/5 border-primary text-primary" 
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Users size={14} className={clsx(activeDropdown === 'position' || selectedPositions.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Position
                  {selectedPositions.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedPositions.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'position' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown 
                  isOpen={activeDropdown === 'position'}
                  options={positions.map(p => ({ 
                    id: p, 
                    label: p,
                    count: employees.filter(e => e.position === p).length
                  }))}
                  selected={selectedPositions}
                  onToggle={(id) => setSelectedPositions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center"><input type="checkbox" checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0} onChange={toggleSelectAll} className="rounded border-border" /></th>
                    {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                      <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={visibleColumns.length + 2} className="px-4 py-6 bg-slate-50/10 border-b border-border/40"></td></tr>
                  )) : filteredEmployees.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length + 2} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No employees found.</td></tr>
                  ) : filteredEmployees.map(e => (
                    <tr 
                      key={e.id} 
                      onClick={() => navigate(`/employees/directory/${e.id}`)}
                      className={clsx('hover:bg-slate-50/60 transition-colors group cursor-pointer', selectedEmployees.includes(e.id) && 'bg-primary/[0.02]')}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedEmployees.includes(e.id)} onChange={() => toggleSelect(e.id)} className="rounded border-border" />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(e)}</td>
                      ))}
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleOpenEdit(e);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={(ev) => handleDeleteClick(e.id, ev)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STATS TAB */
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Members', val: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Departments', val: departments.length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
              { label: 'Online Now', val: Math.floor(employees.length * 0.6), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'New Hires', val: 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100/50' },
            ].map(card => (
              <div key={card.label} className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.bg, card.color)}><card.icon size={20} /></div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{card.label}</span>
                  <span className="text-xl font-black text-slate-900 tabular-nums">{card.val}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4"><Filter size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">By Department</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departments.map(d => ({ name: d, val: employees.filter(e => e.department === d).length }))}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="val"
                    >
                      {departments.map((_, i) => <Cell key={i} fill={['#3b82f6', '#6366f1', '#f97316', '#10b981', '#ec4899'][i % 5]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Hiring Trend</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Jan', v: 4 }, { name: 'Feb', v: 8 }, { name: 'Mar', v: 6 }, { name: 'Apr', v: 12 }, { name: 'May', v: 9 }]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="v" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FILTER BOTTOM SHEET (Mockup) */}
      {showMobileFilter && (
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end bg-black/40">
           <div className="bg-white p-5 rounded-t-3xl h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowMobileFilter(false)}><X /></button>
              </div>
              {/* Filter contents... */}
           </div>
        </div>
      )}

      <EmployeeDialog 
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        onSave={handleSave}
      />

      {/* CONFIRMATION DIALOG */}
      {isConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">Confirm Deletion</h3>
                  <p className="text-[13px] text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedEmployees.length} employees` : 'this employee'}? 
                All associated data will be permanently removed.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-border flex items-center gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-border bg-white text-[13px] font-bold text-slate-600 hover:bg-white/80 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-[13px] font-bold shadow-md shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </div>
  );
};

export default EmployeesPage;
