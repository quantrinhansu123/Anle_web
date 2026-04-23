import React, { useMemo, useState, useEffect } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Search, Plus, RefreshCcw, Edit, Trash2,
  List, BarChart2, Mail, Phone,
  ChevronLeft, Building2, TrendingUp, Users,
  CheckCircle2, Globe, X, Eye, Star, Kanban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  customerService,
  CUSTOMER_STATUS_VALUES,
  type Customer,
  type CustomerStatus
} from '../services/customerService';
import CustomerDialog from './customers/dialogs/CustomerDialog';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useToastContext } from '../contexts/ToastContext';

const STATUS_COLUMNS: Array<{ id: CustomerStatus; label: string; softBg: string; accent: string }> = [
  { id: 'new', label: 'New', softBg: 'bg-blue-50', accent: 'text-blue-700' },
  { id: 'follow_up', label: 'Follow Up', softBg: 'bg-amber-50', accent: 'text-amber-700' },
  { id: 'quotation_sent', label: 'Quotation Sent', softBg: 'bg-indigo-50', accent: 'text-indigo-700' },
  { id: 'meeting', label: 'Meeting', softBg: 'bg-emerald-50', accent: 'text-emerald-700' },
  { id: 'won', label: 'Won', softBg: 'bg-teal-50', accent: 'text-teal-700' },
  { id: 'lost', label: 'Lost', softBg: 'bg-rose-50', accent: 'text-rose-700' }
];

const INITIAL_FORM_STATE: Partial<Customer> = {
  company_name: '',
  email: '',
  phone: '',
  address: '',
  tax_code: '',
  code: '',
  status: 'new'
};

const normalizeStatus = (status: string | undefined): CustomerStatus => {
  if (status && CUSTOMER_STATUS_VALUES.includes(status as CustomerStatus)) {
    return status as CustomerStatus;
  }
  return 'new';
};

const CustomerPage: React.FC = () => {
  const { success, error } = useToastContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggingCustomerId, setDraggingCustomerId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'detail'>('add');
  const [formState, setFormState] = useState<Partial<Customer>>(INITIAL_FORM_STATE);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data.map((item) => ({ ...item, status: normalizeStatus(item.status) })));
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      error(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setFormState(customer);
    setDialogMode('edit');
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
      if (!formState.company_name) {
        error('Company name is required');
        return;
      }
      if (!formState.code || formState.code.length !== 3) {
        error('Customer code must be exactly 3 characters');
        return;
      }

      const payload = {
        ...formState,
        status: normalizeStatus(formState.status),
      };

      if (dialogMode === 'edit' && formState.id) {
        await customerService.updateCustomer(formState.id, payload);
      } else {
        await customerService.createCustomer(payload as any);
      }

      handleCloseDialog();
      fetchData();
      success(dialogMode === 'edit' ? 'Customer updated successfully' : 'Customer created successfully');
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to save customer'));
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
        await customerService.deleteCustomer(confirmAction.id);
        success('Customer deleted successfully');
        if (selectedCustomers.includes(confirmAction.id)) {
          setSelectedCustomers(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedCustomers.map(id => customerService.deleteCustomer(id)));
        success(`${selectedCustomers.length} customers deleted successfully`);
        setSelectedCustomers([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to delete customer(s)'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeStatus = async (id: string, status: CustomerStatus) => {
    const before = customers;
    setCustomers(prev => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      await customerService.updateCustomer(id, { status });
      success('Customer stage updated');
    } catch (err: any) {
      setCustomers(before);
      error(err instanceof Error ? err.message : 'Failed to update customer stage');
    }
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomers([]);
      return;
    }
    setSelectedCustomers(filteredCustomers.map(c => c.id));
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredCustomers = useMemo(
    () => customers.filter(c =>
      c.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.tax_code?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchText.toLowerCase())
    ),
    [customers, searchText]
  );

  const customersByStatus = useMemo(
    () => STATUS_COLUMNS.reduce<Record<CustomerStatus, Customer[]>>((acc, col) => {
      acc[col.id] = filteredCustomers.filter(c => normalizeStatus(c.status) === col.id);
      return acc;
    }, {
      new: [],
      follow_up: [],
      quotation_sent: [],
      meeting: [],
      won: [],
      lost: []
    }),
    [filteredCustomers]
  );

  const statusStats = useMemo(
    () => STATUS_COLUMNS.map((col) => ({
      ...col,
      count: customers.filter(c => normalizeStatus(c.status) === col.id).length,
    })),
    [customers]
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setActiveTab('list')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'list' ? 'bg-white text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List size={14} />
          Kanban
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
            activeTab === 'stats' ? 'bg-white text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart2 size={14} />
          Statistics
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          <div className="p-4 space-y-4 border-b border-border">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <button onClick={() => navigate('/shipments')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"><ChevronLeft size={16} />Back</button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input type="text" placeholder="Search customers..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium" />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-muted transition-all"
                >
                  {selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ? 'Unselect All' : 'Select All'}
                </button>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"
                >
                  <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                {selectedCustomers.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <button
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <Trash2 size={13} />
                      Delete ({selectedCustomers.length})
                    </button>
                    <button
                      onClick={() => setSelectedCustomers([])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-600 bg-white border border-border hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <X size={14} />
                      Clear
                    </button>
                  </div>
                )}
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <Plus size={16} />
                  New Customer
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/40">
            {loading ? (
              <div className="h-full flex items-center justify-center gap-3 text-slate-500">
                <RefreshCcw size={16} className="animate-spin" />
                Loading customers...
              </div>
            ) : (
              <div className="h-full min-w-[1500px] grid grid-cols-6 gap-4 p-4">
                {STATUS_COLUMNS.map((col) => {
                  const items = customersByStatus[col.id];
                  return (
                    <div
                      key={col.id}
                      className={clsx('rounded-2xl border border-border/70 flex flex-col min-h-0', col.softBg)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!draggingCustomerId) return;
                        const moving = customers.find((item) => item.id === draggingCustomerId);
                        setDraggingCustomerId(null);
                        if (!moving || normalizeStatus(moving.status) === col.id) return;
                        handleChangeStatus(draggingCustomerId, col.id);
                      }}
                    >
                      <div className="px-3 py-3 border-b border-border/70 bg-white/70 rounded-t-2xl">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Kanban size={14} className={col.accent} />
                            <h3 className={clsx('text-[12px] font-black uppercase tracking-wide', col.accent)}>{col.label}</h3>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white border border-border">{items.length}</span>
                        </div>
                      </div>

                      <div className="p-3 space-y-3 overflow-y-auto min-h-0">
                        {items.length === 0 ? (
                          <div className="text-center text-[11px] text-slate-400 py-8 italic">No customer in this stage</div>
                        ) : items.map((c) => (
                          <article
                            key={c.id}
                            draggable
                            onDragStart={() => setDraggingCustomerId(c.id)}
                            onDragEnd={() => setDraggingCustomerId(null)}
                            onClick={() => navigate(`/customers/directory/${c.id}`)}
                            className={clsx(
                              'bg-white rounded-xl border border-border shadow-sm p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2',
                              selectedCustomers.includes(c.id) && 'ring-2 ring-primary/30'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[13px] font-black text-slate-900 leading-tight">{c.company_name}</p>
                                <p className="text-[11px] text-slate-500 font-bold uppercase mt-0.5">{c.code || '---'} {c.tax_code ? `• ${c.tax_code}` : ''}</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedCustomers.includes(c.id)}
                                onClick={e => toggleSelect(c.id, e)}
                                onChange={() => {}}
                                className="rounded border-border"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Mail size={12} className="text-slate-400" />
                                <span className="text-[11px] font-medium truncate">{c.email || '—'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={12} className="text-slate-400" />
                                <span className="text-[11px] font-medium">{c.phone || '—'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3].map((star) => {
                                  const rank = c.rank || 0;
                                  const isHalf = rank === star - 0.5;
                                  return (
                                    <div key={star} className="relative w-3.5 h-3.5 flex items-center justify-center">
                                      <Star size={14} className="absolute inset-0 fill-slate-100 text-slate-200" />
                                      {(rank >= star || isHalf) && (
                                        <div className={clsx('absolute inset-y-0 left-0 overflow-hidden text-left', isHalf ? 'w-1/2' : 'w-full')}>
                                          <Star size={14} className="fill-amber-400 text-amber-400 min-w-3.5" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <select
                                value={normalizeStatus(c.status)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleChangeStatus(c.id, e.target.value as CustomerStatus)}
                                className="px-2 py-1 rounded-lg border border-border bg-white text-[11px] font-bold"
                              >
                                {STATUS_COLUMNS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                              </select>
                            </div>

                            <div className="pt-1 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => navigate(`/customers/directory/${c.id}`)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(c.id, e)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
            <span className="text-[12px] font-medium text-slate-500">Total: <b>{filteredCustomers.length}</b> customer(s)</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Customers', val: customers.length, icon: Building2, color: 'text-primary', bg: 'bg-primary/5' },
              { label: 'New Leads', val: statusStats.find((s) => s.id === 'new')?.count || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'In Meeting', val: statusStats.find((s) => s.id === 'meeting')?.count || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Won', val: statusStats.find((s) => s.id === 'won')?.count || 0, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Lost', val: statusStats.find((s) => s.id === 'lost')?.count || 0, icon: Globe, color: 'text-rose-600', bg: 'bg-rose-50' },
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
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 h-75 flex flex-col">
              <div className="flex items-center gap-2 mb-4"><Users size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Pipeline Distribution</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusStats.map((s) => ({ name: s.label, val: s.count || 0 })).filter((s) => s.val > 0)}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="val"
                    >
                      {statusStats.map((_, i) => (
                        <Cell key={i} fill={['#3b82f6', '#f59e0b', '#6366f1', '#10b981', '#f43f5e'][i % 5]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 h-75 flex flex-col">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Stage Breakdown</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusStats.map((s) => ({ name: s.label, value: s.count }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomerDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        mode={dialogMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={(key, val) => setFormState(prev => ({ ...prev, [key]: val }))}
        onSave={handleSave}
        onEdit={() => setDialogMode('edit')}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isProcessing={isDeleting}
        message={
          <>
            Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedCustomers.length} customers` : 'this customer'}?
            All associated data will be permanently removed.
          </>
        }
      />
    </div>
  );
};

export default CustomerPage;

