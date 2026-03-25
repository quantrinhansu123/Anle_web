import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2,
  FileText, List, RefreshCcw,
  ChevronLeft, Calendar, Hash,
  Users, ChevronRight, BarChart2,
  TrendingUp, Clock, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { paymentRequestService } from '../services/paymentRequestService';
import { shipmentService } from '../services/shipmentService';
import { supplierService } from '../services/supplierService';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import { formatDate } from '../lib/utils';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import type { PaymentRequest, PaymentRequestFormState } from './payment-requests/types';
import PaymentRequestDialog from './payment-requests/dialogs/PaymentRequestDialog';
import { DateTime } from 'luxon';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { toast } from '../lib/toast';

// --- CONFIGURATION ---
type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (r: PaymentRequest) => React.ReactNode };
const COLUMN_DEFS: Record<string, ColDef> = {
  no_doc: {
    label: 'Doc No',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40 border-r border-border/40 w-32',
    tdClass: 'px-4 py-4 border-b border-border/60 border-r border-border/40 font-bold text-primary text-[13px]',
    renderContent: (r) => (
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-primary/60" />
        <span>{r.no_doc}</span>
      </div>
    )
  },
  shipment_id: {
    label: 'Shipment ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40 border-r border-border/40 w-48',
    tdClass: 'px-4 py-4 border-b border-border/60 border-r border-border/40',
    renderContent: (r) => (
      <div className="flex items-center gap-2">
        <Hash size={14} className="text-muted-foreground/40" />
        <span className="text-[12px] font-mono font-medium text-slate-600">#{r.shipment_id.slice(0, 8)}</span>
      </div>
    )
  },
  request_date: {
    label: 'Request Date',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40 border-r border-border/40 w-48',
    tdClass: 'px-4 py-4 border-b border-border/60 border-r border-border/40',
    renderContent: (r) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-muted-foreground/40" />
        <span className="text-[13px] text-slate-600 font-medium">
          {formatDate(r.request_date)}
        </span>
      </div>
    )
  },
  supplier: {
    label: 'Supplier',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40 border-r border-border/40 w-56',
    tdClass: 'px-4 py-4 border-b border-border/60 border-r border-border/40',
    renderContent: (r) => <span className="text-[13px] font-medium text-slate-700">{r.shipments?.suppliers?.company_name || '—'}</span>
  },
  total: {
    label: 'Total Amount',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-b border-border/40 w-32 text-right',
    tdClass: 'px-4 py-4 border-b border-border/60 text-right font-black text-primary tabular-nums',
    renderContent: (r) => <span>{r.total_amount?.toLocaleString()}</span>
  }
};
const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const INITIAL_FORM_STATE: PaymentRequestFormState = {
  shipment_id: '',
  request_date: DateTime.now().toISODate()!,
  account_name: '',
  account_number: '',
  bank_name: '',
  invoices: [
    { no_invoice: '', description: '', date_issue: '', payable_amount: 0 }
  ]
};

const PaymentRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  // Data State
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Filter State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string, company_name: string }[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [formState, setFormState] = useState<PaymentRequestFormState>(INITIAL_FORM_STATE);
  const [shipmentOptions, setShipmentOptions] = useState<{ value: string, label: string }[]>([]);

  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

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
      const data = await paymentRequestService.getPaymentRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch payment requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [shipmentsData, suppliersData] = await Promise.all([
        shipmentService.getShipments(1, 1000),
        supplierService.getSuppliers()
      ]);

      setShipmentOptions(shipmentsData.map(s => ({
        value: s.id,
        label: `Shipment #${s.id.slice(0, 8)} - ${s.customers?.company_name || 'N/A'}`
      })));

      setSuppliers(suppliersData.map(s => ({ id: s.id, company_name: s.company_name })));
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = async (request: PaymentRequest) => {
    try {
      const fullRequest = await paymentRequestService.getPaymentRequestById(request.id);
      setFormState({
        id: fullRequest.id,
        shipment_id: fullRequest.shipment_id,
        request_date: fullRequest.request_date,
        account_name: fullRequest.account_name || '',
        account_number: fullRequest.account_number || '',
        bank_name: fullRequest.bank_name || '',
        invoices: fullRequest.invoices?.length
          ? fullRequest.invoices.map(inv => ({
            no_invoice: inv.no_invoice,
            description: inv.description,
            date_issue: inv.date_issue,
            payable_amount: inv.payable_amount || 0
          }))
          : [{ no_invoice: '', description: '', date_issue: '', payable_amount: 0 }]
      });
      setIsEditMode(true);
      setIsDetailMode(false);
      setIsDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch request details:', err);
    }
  };

  const handleOpenDetail = async (request: PaymentRequest) => {
    try {
      const fullRequest = await paymentRequestService.getPaymentRequestById(request.id);
      setFormState({
        id: fullRequest.id,
        shipment_id: fullRequest.shipment_id,
        request_date: fullRequest.request_date,
        account_name: fullRequest.account_name || '',
        account_number: fullRequest.account_number || '',
        bank_name: fullRequest.bank_name || '',
        invoices: fullRequest.invoices?.length
          ? fullRequest.invoices.map(inv => ({
            no_invoice: inv.no_invoice,
            description: inv.description,
            date_issue: inv.date_issue,
            payable_amount: inv.payable_amount || 0
          }))
          : [{ no_invoice: '', description: '', date_issue: '', payable_amount: 0 }]
      });
      setIsEditMode(false);
      setIsDetailMode(true);
      setIsDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch request details:', err);
    }
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
      if (!formState.shipment_id) {
        toast.error('Please select a shipment');
        return;
      }

      if (isEditMode && formState.id) {
        await paymentRequestService.updatePaymentRequest(formState.id, formState);
      } else {
        await paymentRequestService.createPaymentRequest(formState);
      }

      handleCloseDialog();
      fetchData();
      toast.success(isEditMode ? 'Payment request updated successfully' : 'Payment request created successfully');
    } catch (err) {
      console.error('Failed to save payment request:', err);
      toast.error('Failed to save payment request');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment request?')) return;
    try {
      await paymentRequestService.deletePaymentRequest(id);
      fetchData();
      toast.success('Payment request deleted successfully');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredRequests = requests.filter(r => {
    // Search filter
    const search = searchText.toLowerCase();
    const matchesSearch = (
      r.no_doc?.toLowerCase().includes(search) ||
      r.shipment_id.toLowerCase().includes(search) ||
      r.account_name?.toLowerCase().includes(search)
    );
    if (!matchesSearch) return false;

    // Supplier filter
    if (selectedSuppliers.length > 0) {
      const supplierId = r.shipments?.supplier_id;
      if (!supplierId || !selectedSuppliers.includes(supplierId)) return false;
    }

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length && filteredRequests.length > 0) setSelectedRequests([]);
    else setSelectedRequests(filteredRequests.map(r => r.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedRequests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalAmount = requests.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const avgAmount = requests.length > 0 ? totalAmount / requests.length : 0;

  // Prepare Stats Data
  const supplierStats = suppliers.map(s => ({
    name: s.company_name,
    amount: requests.filter(r => r.shipments?.supplier_id === s.id).reduce((sum, r) => sum + (r.total_amount || 0), 0),
    count: requests.filter(r => r.shipments?.supplier_id === s.id).length
  })).filter(s => s.count > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);

  const trendData = Array.from({ length: 5 }).map((_, i) => {
    const date = DateTime.now().minus({ months: 4 - i });
    const label = date.toFormat('LLL');
    const val = requests.filter(r => DateTime.fromISO(r.request_date).hasSame(date, 'month')).length;
    return { name: label, v: val };
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={() => setActiveTab('list')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
            activeTab === 'list' ? "bg-white text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <List size={14} />
          List View
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
            activeTab === 'stats' ? "bg-white text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart2 size={14} />
          Statistics
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 animate-in fade-in slide-in-from-left-4 duration-500">
          {/* TOOLBAR */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0">
                  <ChevronLeft size={16} />Back
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
                <button onClick={fetchData} className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all">
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
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all font-inter"
                >
                  <Plus size={16} />
                  New Payment Request
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'supplier' ? null : 'supplier');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'supplier' || selectedSuppliers.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Users size={14} className={clsx(activeDropdown === 'supplier' || selectedSuppliers.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Supplier
                  {selectedSuppliers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedSuppliers.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'supplier' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'supplier'}
                  options={suppliers.map(s => ({
                    id: s.id,
                    label: s.company_name,
                    count: requests.filter(r => r.shipments?.supplier_id === s.id).length
                  }))}
                  selected={selectedSuppliers}
                  onToggle={(id) => setSelectedSuppliers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-auto border-t border-border bg-slate-50/20">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                    <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={visibleColumns.length + 2} className="px-4 py-6 bg-slate-50/10 border-b border-border/40"></td>
                    </tr>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No payment requests found.</td>
                  </tr>
                ) : (
                  filteredRequests.map(r => (
                    <tr 
                      key={r.id} 
                      onClick={() => handleOpenDetail(r)}
                      className={clsx(
                        'hover:bg-slate-50/60 transition-colors group cursor-pointer', 
                        selectedRequests.includes(r.id) && 'bg-primary/[0.02]'
                      )}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-border"
                        />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(r)}</td>
                      ))}
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
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

          {/* FOOTER */}
          <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
            <span className="text-[12px] font-medium text-slate-500">
              Showing <b>1</b> – <b>{filteredRequests.length}</b> of <b>{filteredRequests.length}</b> result(s)
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Prev</button>
              <button className="px-4 py-1.5 rounded-lg border border-border bg-primary text-white text-[12px] font-bold shadow-sm ring-1 ring-primary/20 transition-all">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      ) : (
        /* STATS TAB */
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', val: requests.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Amount', val: totalAmount.toLocaleString(), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Avg per Request', val: avgAmount.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Pending Docs', val: 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
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
            <div className="bg-white rounded-2xl border border-border shadow-sm p-6 h-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-6 text-primary font-bold text-[12px] uppercase">
                <Users size={16} />
                <span>Amount by Supplier (Top 5)</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierStats}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="amount"
                    >
                      {supplierStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444'][index % 5]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-6 h-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-6 text-primary font-bold text-[12px] uppercase">
                <TrendingUp size={16} />
                <span>Request Volume Trend</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between text-[11px] font-bold text-primary uppercase">
              <span>Top Suppliers by Amount</span>
              <Users size={16} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-muted-foreground border-b border-border/60 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-3">Supplier Name</th>
                    <th className="px-6 py-3 text-right">Count</th>
                    <th className="px-6 py-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {supplierStats.map(s => (
                    <tr key={s.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{s.name}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-slate-500 font-medium">{s.count}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-primary font-black">{s.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PaymentRequestDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        isDetailMode={isDetailMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={(key, val) => setFormState(prev => ({ ...prev, [key]: val }))}
        shipmentOptions={shipmentOptions}
        onSave={handleSave}
      />
    </div>
  );
};

export default PaymentRequestsPage;
