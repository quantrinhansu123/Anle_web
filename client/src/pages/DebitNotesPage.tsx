import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus,
  Edit, Trash2, List, BarChart2,
  RefreshCcw, Receipt, Calculator,
  Calendar, TrendingUp, TrendingDown,
  PieChart as PieIcon, Tag as TagIcon, AlertCircle, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatDate } from '../lib/utils';
import { debitNoteService } from '../services/debitNoteService';
import { shipmentService } from '../services/shipmentService';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import DebitNoteDialog from './debit-notes/dialogs/DebitNoteDialog';
import type { DebitNote, DebitNoteFormState } from './debit-notes/types';
import type { Shipment } from './shipments/types';
import { useToastContext } from '../contexts/ToastContext';

// --- CONFIGURATION ---
type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (n: DebitNote) => React.ReactNode };
const COLUMN_DEFS: Record<string, ColDef> = {
  shipment_id: {
    label: 'ID Shipment',
    thClass: 'px-6 py-3 border-r border-b border-border/40 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32',
    tdClass: 'px-6 py-4 border-r border-border/40 font-mono text-[12px] font-bold text-primary',
    renderContent: (n) => <span>{n.shipments?.code || `#${n.shipment_id.slice(0, 8)}`}</span>
  },
  date: {
    label: 'Date',
    thClass: 'px-6 py-3 border-r border-b border-border/40 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32',
    tdClass: 'px-6 py-4 border-r border-border/40 text-[13px] font-medium text-slate-600',
    renderContent: (n) => <span>{formatDate(n.note_date)}</span>
  },
  no_doc: {
    label: 'No_Doc',
    thClass: 'px-6 py-3 border-r border-b border-border/40 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-80',
    tdClass: 'px-6 py-4 border-r border-border/40 text-[13px] font-bold text-slate-900 whitespace-nowrap',
    renderContent: (n) => <span>{n.no_doc}</span>
  },
  customer: {
    label: 'Customer',
    thClass: 'px-6 py-3 border-r border-b border-border/40 text-left text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight',
    tdClass: 'px-6 py-4 border-r border-border/40 text-[13px] font-medium text-slate-700',
    renderContent: (n) => <span className="line-clamp-1">{n.shipments?.customers?.company_name || '—'}</span>
  }
};
const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const INITIAL_FORM_STATE: DebitNoteFormState = {
  shipment_id: '',
  note_date: new Date().toISOString().split('T')[0],
  invoice_items: [],
  chi_ho_items: []
};

const DebitNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedDebitNotes, setSelectedDebitNotes] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [formState, setFormState] = useState<DebitNoteFormState>(INITIAL_FORM_STATE);
  const [shipmentOptions, setShipmentOptions] = useState<(Shipment & { value: string, label: string })[]>([]);

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await debitNoteService.getDebitNotes(1, 100);
      setDebitNotes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const shipments = await shipmentService.getShipments(1, 500);
      setShipmentOptions(shipments.map(s => ({
        ...s,
        value: s.id,
        label: `${s.code || '#' + s.id.slice(0, 8)} - ${s.customers?.company_name || 'No Customer'}`
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = async (note: DebitNote) => {
    try {
      const data = await debitNoteService.getDebitNoteById(note.id);
      if (data) {
        setFormState({
          id: data.id,
          shipment_id: data.shipment_id,
          note_date: data.note_date,
          invoice_items: data.invoice_items || [],
          chi_ho_items: data.chi_ho_items || [],
          relatedShipment: data.shipments as any
        });
        setIsEditMode(true);
        setIsDetailMode(false);
        setIsDialogOpen(true);
      }
    } catch (err) {
      console.error(err);
      error('Failed to fetch details');
    }
  };

  const handleOpenDetail = async (note: DebitNote) => {
    try {
      const data = await debitNoteService.getDebitNoteById(note.id);
      if (data) {
        setFormState({
          id: data.id,
          shipment_id: data.shipment_id,
          note_date: data.note_date,
          invoice_items: data.invoice_items || [],
          chi_ho_items: data.chi_ho_items || [],
          relatedShipment: data.shipments as any
        });
        setIsEditMode(false);
        setIsDetailMode(true);
        setIsDialogOpen(true);
      }
    } catch (err) {
      console.error(err);
      error('Failed to fetch details');
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
      if (isEditMode && formState.id) {
        await debitNoteService.updateDebitNote(formState.id, formState);
      } else {
        await debitNoteService.createDebitNote(formState);
      }
      handleCloseDialog();
      fetchData();
      success(isEditMode ? 'Debit note updated successfully' : 'Debit note created successfully');
    } catch (err) {
      console.error(err);
      error('Failed to save');
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
        await debitNoteService.deleteDebitNote(confirmAction.id);
        success('Debit note deleted successfully');
        if (selectedDebitNotes.includes(confirmAction.id)) {
          setSelectedDebitNotes(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedDebitNotes.map(id => debitNoteService.deleteDebitNote(id)));
        success(`${selectedDebitNotes.length} debit notes deleted successfully`);
        setSelectedDebitNotes([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
      error('Failed to delete debit note(s)');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotes = debitNotes.filter(n => {
    const search = searchText.toLowerCase();
    return (
      n.no_doc.toLowerCase().includes(search) ||
      n.shipment_id.toLowerCase().includes(search) ||
      n.shipments?.customers?.company_name?.toLowerCase().includes(search)
    );
  });

  const toggleSelectAll = () => {
    if (selectedDebitNotes.length === filteredNotes.length) setSelectedDebitNotes([]);
    else setSelectedDebitNotes(filteredNotes.map(n => n.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedDebitNotes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const setFormField = <K extends keyof DebitNoteFormState>(key: K, value: DebitNoteFormState[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  // --- STATISTICS CALCULATION ---
  const stats = useMemo(() => {
    let totalInvoice = 0;
    let totalChiHo = 0;

    // Total Amount calculations
    debitNotes.forEach(note => {
      const invTotal = note.invoice_items?.reduce((acc, it) => acc + (it.total || (it.rate * it.quantity * (1 + (it.tax_percent || 0) / 100))), 0) || 0;
      const chiHoTotal = note.chi_ho_items?.reduce((acc, it) => acc + (it.total || (it.rate * it.quantity)), 0) || 0;
      totalInvoice += invTotal;
      totalChiHo += chiHoTotal;
    });

    const netAmount = totalInvoice + totalChiHo;

    // Monthly trend
    const monthlyMap = new Map<string, { name: string, inv: number, chiho: number }>();
    debitNotes.forEach(note => {
      const month = note.note_date.slice(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) || { name: month, inv: 0, chiho: 0 };
      const invTotal = note.invoice_items?.reduce((acc, it) => acc + (it.total || (it.rate * it.quantity * (1 + (it.tax_percent || 0) / 100))), 0) || 0;
      const chiHoTotal = note.chi_ho_items?.reduce((acc, it) => acc + (it.total || (it.rate * it.quantity)), 0) || 0;

      monthlyMap.set(month, {
        name: month,
        inv: current.inv + invTotal,
        chiho: current.chiho + chiHoTotal
      });
    });

    const trendData = Array.from(monthlyMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-6);

    // Distribution Data
    const distributionData = [
      { name: 'Invoice', val: totalInvoice },
      { name: 'Disbursements', val: totalChiHo }
    ];

    // Customer comparison
    const customerMap = new Map<string, { name: string, total: number }>();
    debitNotes.forEach(note => {
      const customerName = note.shipments?.customers?.company_name || 'Individual';
      const invTotal = note.invoice_items?.reduce((acc, it) => acc + (it.total || (it.rate * it.quantity * (1 + (it.tax_percent || 0) / 100))), 0) || 0;
      const chiHoTotal = note.chi_ho_items?.reduce((acc, it) => acc + (it.total || (it.rate * it.quantity)), 0) || 0;
      const current = customerMap.get(customerName) || { name: customerName, total: 0 };

      customerMap.set(customerName, {
        name: customerName,
        total: current.total + invTotal + chiHoTotal
      });
    });

    const customerData = Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { totalInvoice, totalChiHo, netAmount, trendData, distributionData, customerData };
  }, [debitNotes]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      {/* Tab Selectors */}
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
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          {/* TOOLBAR */}
          <div className="hidden md:block p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => navigate('/financials')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0 font-inter"><ChevronLeft size={16} />Back</button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search debit notes..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchData} className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all"><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></button>
                <ColumnSettings
                  columns={COLUMN_DEFS}
                  visibleColumns={visibleColumns}
                  columnOrder={columnOrder}
                  onVisibleColumnsChange={setVisibleColumns}
                  onColumnOrderChange={setColumnOrder}
                  defaultOrder={DEFAULT_COL_ORDER}
                />
                {selectedDebitNotes.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <button
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <Trash2 size={13} />
                      Delete ({selectedDebitNotes.length})
                    </button>
                    <button
                      onClick={() => setSelectedDebitNotes([])}
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
                  New Debit Note
                </button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center">
                      <input type="checkbox" checked={selectedDebitNotes.length === filteredNotes.length && filteredNotes.length > 0} onChange={toggleSelectAll} className="rounded border-border" />
                    </th>
                    {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                      <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                    ))}
                    <th className="px-6 py-3 text-center border-b border-border/40 text-[11px] font-bold text-muted-foreground uppercase tracking-tight w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={visibleColumns.length + 2} className="px-6 py-6 border-b border-border/40"></td>
                    </tr>
                  )) : filteredNotes.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length + 2} className="px-6 py-20 text-center italic text-muted-foreground opacity-60">No debit notes found.</td></tr>
                  ) : filteredNotes.map(n => (
                    <tr
                      key={n.id}
                      onClick={() => handleOpenDetail(n)}
                      className={clsx(
                        'hover:bg-slate-50/60 transition-colors group cursor-pointer',
                        selectedDebitNotes.includes(n.id) && 'bg-primary/[0.02]'
                      )}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedDebitNotes.includes(n.id)} onChange={() => toggleSelect(n.id)} className="rounded border-border" />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(n)}</td>
                      ))}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(n)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(n.id, e)}
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

            {/* Pagination Footer */}
            <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-[12px] font-medium text-slate-500">Showing <b>1</b> – <b>{filteredNotes.length}</b> of <b>{filteredNotes.length}</b> result(s)</span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Prev</button>
                <button className="px-4 py-1.5 rounded-lg border border-border bg-primary text-white text-[12px] font-bold shadow-sm ring-1 ring-primary/20 transition-all">1</button>
                <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>

          {/* MOBILE LIST */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3 border-t border-border">
            {filteredNotes.map(n => (
              <div
                key={n.id}
                onClick={() => handleOpenDetail(n)}
                className="bg-white rounded-2xl border border-border p-4 shadow-sm cursor-pointer hover:border-primary/40 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono font-bold text-primary">{n.shipments?.code || `#${n.shipment_id.slice(0, 8)}`}</span>
                    <span className="text-[14px] font-bold text-slate-900 leading-tight">{n.no_doc}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleOpenEdit(n)} className="p-2 text-muted-foreground hover:text-blue-600 bg-slate-50 rounded-lg"><Edit size={16} /></button>
                    <button onClick={(e) => handleDeleteClick(n.id, e)} className="p-2 text-muted-foreground hover:text-red-600 bg-slate-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-2"><Calendar size={12} /><span>{formatDate(n.note_date)}</span></div>
                  <span className="font-bold text-slate-600">{n.shipments?.customers?.company_name || 'No Customer'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* STATS TAB - REAL IMPLEMENTATION */
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Value', val: new Intl.NumberFormat('vi-VN').format(stats.netAmount) + ' ₫', icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Invoiced', val: new Intl.NumberFormat('vi-VN').format(stats.totalInvoice) + ' ₫', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'Disbursements', val: new Intl.NumberFormat('vi-VN').format(stats.totalChiHo) + ' ₫', icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-100/50' },
              { label: 'Average/Note', val: new Intl.NumberFormat('vi-VN').format(Math.round(stats.netAmount / (debitNotes.length || 1))) + ' ₫', icon: Calculator, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
            ].map(card => (
              <div key={card.label} className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.bg, card.color)}><card.icon size={20} /></div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{card.label}</span>
                  <span className="text-[15px] lg:text-xl font-black text-slate-900 tabular-nums truncate">{card.val}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pie Chart: Distribution */}
            <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <PieIcon size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Debit Distribution</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.distributionData}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="val"
                    >
                      <Cell fill="#3b82f6" stroke="none" />
                      <Cell fill="#f97316" stroke="none" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                      formatter={(val: any) => new Intl.NumberFormat('vi-VN').format(Number(val)) + ' ₫'}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">INVOICE</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">DISBURSEMENT</span></div>
              </div>
            </div>

            {/* Bar Chart: Monthly trend */}
            <div className="md:col-span-2 bg-white rounded-[2rem] border border-border shadow-sm p-6 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Financial Trend (Monthly)</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                      formatter={(val: any) => new Intl.NumberFormat('vi-VN').format(Number(val)) + ' ₫'}
                    />
                    <Bar name="Invoice" dataKey="inv" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar name="Disbursements" dataKey="chiho" fill="#f97316" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Customer table */}
          <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider leading-none">Top Revenue Customers</span>
              <TagIcon size={16} className="text-primary" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-6 py-3 font-bold uppercase tracking-tight">Customer Name</th>
                    <th className="px-6 py-3 font-bold uppercase text-right tracking-tight">Total Debit Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.customerData.length > 0 ? stats.customerData.map(c => (
                    <tr key={c.name} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold text-slate-700 group-hover:text-primary transition-colors">{c.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[13px] font-black text-slate-900 tabular-nums">
                          {new Intl.NumberFormat('vi-VN').format(c.total)} ₫
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="px-6 py-12 text-center text-muted-foreground italic text-[13px]">No customer data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG */}
      <DebitNoteDialog
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
        setFormField={setFormField}
        shipmentOptions={shipmentOptions}
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
                Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedDebitNotes.length} debit notes` : 'this debit note'}?
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

export default DebitNotesPage;
