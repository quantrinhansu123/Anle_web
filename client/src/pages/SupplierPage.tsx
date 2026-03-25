import React, { useState, useEffect } from 'react';
import {
  Search, Plus, RefreshCcw, Edit, Trash2, 
  List, BarChart2, Mail, Phone, MapPin, 
  ChevronLeft, Building2, TrendingUp, Users, 
  Globe, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { supplierService, type Supplier } from '../services/supplierService';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import AddEditSupplierDialog from './suppliers/dialogs/AddEditSupplierDialog';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { toast } from '../lib/toast';

const INITIAL_FORM_STATE: Partial<Supplier> = {
  id: '',
  company_name: '',
  email: '',
  phone: '',
  address: '',
  tax_code: ''
};

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (s: Supplier) => React.ReactNode };
const COLUMN_DEFS_BASE: Record<string, ColDef> = {
  id: {
    label: 'Code',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-24 border-r border-b border-border/40 text-center',
    tdClass: 'px-4 py-4 border-r border-border/40 text-center',
    renderContent: (s) => <span className="text-[13px] font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">{s.id}</span>
  },
  tax_code: {
    label: 'Tax Code',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32 border-r border-b border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] uppercase tracking-wider',
    renderContent: (s) => s.tax_code || '—'
  },
  contact: {
    label: 'Contact Info',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-48 border-r border-b border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-slate-600">
          <Mail size={12} className="text-slate-300" />
          <span className="text-[12px] font-medium truncate max-w-[180px]">{s.email || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Phone size={12} className="text-slate-300" />
          <span className="text-[12px] font-medium">{s.phone || '—'}</span>
        </div>
      </div>
    )
  },
  address: {
    label: 'Address',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-r border-b border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => (
      <div className="flex items-start gap-2 text-slate-600">
        <MapPin size={12} className="text-slate-300 mt-0.5 shrink-0" />
        <span className="text-[12px] font-medium leading-relaxed italic opacity-80">{s.address || '—'}</span>
      </div>
    )
  }
};

const COLUMN_DEFS: Record<string, ColDef> = {
  ...COLUMN_DEFS_BASE,
  company_name: {
    label: 'Company Name',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-64 border-r border-b border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => (
      <span className="text-[14px] font-bold text-foreground leading-tight">{s.company_name}</span>
    )
  }
};

const DEFAULT_COL_ORDER = ['id', 'company_name', 'tax_code', 'contact', 'address'];

const SupplierPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<Partial<Supplier>>(INITIAL_FORM_STATE);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setFormState(supplier);
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
      if (!isEditMode && (!formState.id || formState.id.length !== 3)) {
        toast.error('Supplier Code must be exactly 3 characters');
        return;
      }
      if (!formState.company_name) {
        toast.error('Company name is required');
        return;
      }

      if (isEditMode && formState.id) {
        const { id, ...dto } = formState;
        await supplierService.updateSupplier(id!, dto);
      } else {
        await supplierService.createSupplier(formState as any);
      }

      handleCloseDialog();
      fetchData();
      toast.success(isEditMode ? 'Supplier updated successfully' : 'Supplier created successfully');
    } catch (err) {
      console.error('Failed to save supplier:', err);
      toast.error('Failed to save supplier');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await supplierService.deleteSupplier(id);
      fetchData();
      toast.success('Supplier deleted successfully');
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      toast.error('Failed to delete supplier');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.company_name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.id.toLowerCase().includes(searchText.toLowerCase()) ||
    s.tax_code?.toLowerCase().includes(searchText.toLowerCase())
  );

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
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => navigate('/shipments')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"><ChevronLeft size={16} />Back</button>
                <div className="relative flex-1 max-sm:max-w-none max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input type="text" placeholder="Search suppliers..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium" />
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

                <button 
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all font-inter"
                >
                  <Plus size={16} />
                  New Supplier
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto border-t border-border bg-slate-50/20">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                    <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={visibleColumns.length + 1} className="px-4 py-8 bg-slate-50/10 border-b border-border/40"></td></tr>
                )) : filteredSuppliers.length === 0 ? (
                  <tr><td colSpan={visibleColumns.length + 1} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No suppliers found.</td></tr>
                ) : filteredSuppliers.map(s => (
                  <tr 
                    key={s.id} 
                    onClick={() => navigate(`/suppliers/directory/${s.id}`)}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  >
                    {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                      <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(s)}</td>
                    ))}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all font-bold"
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
          
          <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
            <span className="text-[12px] font-medium text-slate-500">Total: <b>{filteredSuppliers.length}</b> supplier(s)</span>
          </div>
        </div>
      ) : (
        /* STATS TAB */
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Suppliers', val: suppliers.length, icon: Building2, color: 'text-primary', bg: 'bg-primary/5' },
              { label: 'Carrier Partners', val: 0, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'New This Year', val: 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
              { label: 'Active Regions', val: 0, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
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
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 h-[300px] flex flex-col shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-4"><Users size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Top Suppliers</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={suppliers.slice(0, 5).map((s) => ({ name: s.company_name, val: 1 }))} 
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="val"
                    >
                      {suppliers.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={['#3b82f6', '#6366f1', '#4f46e5', '#22c55e', '#ec4899'][i % 5]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 h-[300px] flex flex-col shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Supplier Onboarding</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Jan', v: 1 }, { name: 'Feb', v: 3 }, { name: 'Mar', v: 2 }]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="v" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddEditSupplierDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={(key, val) => setFormState(prev => ({ ...prev, [key]: val }))}
        onSave={handleSave}
      />
    </div>
  );
};

export default SupplierPage;
