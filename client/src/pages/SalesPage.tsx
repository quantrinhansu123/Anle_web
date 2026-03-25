import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus, List,
  Edit, Trash2, RefreshCcw,
  BadgeDollarSign, TrendingUp,
  BarChart2, Calculator, DollarSign, ChevronRight, X, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { salesService } from '../services/salesService';
import { shipmentService } from '../services/shipmentService';
import { supplierService } from '../services/supplierService';
import type { Supplier } from '../services/supplierService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import type { SalesItem, SalesFormState } from './sales/types';
import AddEditSalesDialog from './sales/dialogs/AddEditSalesDialog';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// --- CONFIGURATION ---
const INITIAL_FORM_STATE: SalesFormState = {
  shipment_id: '',
  description: '',
  rate: 0,
  quantity: 0,
  unit: '',
  currency: 'VND',
  exchange_rate: 1,
  tax_percent: 0,
};

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (s: SalesItem) => React.ReactNode };
const COLUMN_DEFS: Record<string, ColDef> = {
  shipment: {
    label: 'Shipment ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 font-mono text-[12px] font-bold text-primary',
    renderContent: (s) => <span>#{s.shipment_id?.slice(0, 8) || '—'}</span>
  },
  description: {
    label: 'Description',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => (
      <div className="flex flex-col max-w-xs xl:max-w-md">
        <span className="text-[13px] font-bold text-foreground line-clamp-1">{s.description || '—'}</span>
        <span className="text-[11px] text-muted-foreground opacity-70 italic">{s.unit} x {s.quantity}</span>
      </div>
    )
  },
  price: {
    label: 'Price (Rate)',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 border-r border-border/40 text-right',
    tdClass: 'px-4 py-4 border-r border-border/40 text-right font-medium text-[13px] tabular-nums',
    renderContent: (s) => <span>{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(s.rate)} {s.currency}</span>
  },
  tax: {
    label: 'Tax',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32 border-r border-border/40 text-right',
    tdClass: 'px-4 py-4 border-r border-border/40 text-right',
    renderContent: (s) => <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{s.tax_percent}%</span>
  },
  total: {
    label: 'Total',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 text-right',
    tdClass: 'px-4 py-4 text-right font-black text-[14px] text-primary tabular-nums',
    renderContent: (s) => <span>{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(s.total)} {s.currency}</span>
  }
};
const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [selectedSalesItems, setSelectedSalesItems] = useState<string[]>([]);
  const [shipments, setShipments] = useState<{ value: string, label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchText, setSearchText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<SalesFormState>(INITIAL_FORM_STATE);

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
    fetchShipmentOptions();
    fetchSuppliers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data: any = await salesService.getSalesItems(1, 100);
      setSalesItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sales items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipmentOptions = async () => {
    try {
      const data: any = await shipmentService.getShipments(1, 100);
      const shipmentsData = Array.isArray(data) ? data : data.data || [];
      setShipments(shipmentsData.map((s: any) => ({
        value: s.id,
        label: `#${s.id.slice(0, 8)} - ${s.customers?.company_name || 'No Customer'}`
      })));
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    }
  };
  const fetchSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const setFormField = <K extends keyof SalesFormState>(key: K, value: SalesFormState[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: SalesItem) => {
    setFormState({
      id: item.id,
      shipment_id: item.shipment_id,
      description: item.description,
      rate: item.rate,
      quantity: item.quantity,
      unit: item.unit,
      currency: item.currency,
      exchange_rate: item.exchange_rate,
      tax_percent: item.tax_percent,
    });
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
      if (!formState.shipment_id) {
        alert('Please select a shipment');
        return;
      }
      if (isEditMode && formState.id) {
        await salesService.updateSalesItem(formState.id, formState);
      } else {
        await salesService.createSalesItem(formState);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Failed to save sales item:', err);
      alert('Failed to save sales item. Please check your data.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales item?')) return;
    try {
      await salesService.deleteSalesItem(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete sales item:', err);
    }
  };

  const filteredItems = salesItems.filter(item => {
    // Text search
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesText =
        item.description?.toLowerCase().includes(search) ||
        item.shipment_id?.toLowerCase().includes(search) ||
        item.unit?.toLowerCase().includes(search);
      if (!matchesText) return false;
    }

    // Currency filter
    if (selectedCurrencies.length > 0 && !selectedCurrencies.includes(item.currency)) {
      return false;
    }

    // Supplier filter
    if (selectedSuppliers.length > 0) {
      const itemSupplierId = item.shipments?.supplier_id;
      if (!itemSupplierId || !selectedSuppliers.includes(itemSupplierId)) {
        return false;
      }
    }

    return true;
  });

  const toggleCurrency = (curr: string) => {
    setSelectedCurrencies(prev =>
      prev.includes(curr) ? prev.filter(c => c !== curr) : [...prev, curr]
    );
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedSalesItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSalesItems.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedSalesItems([]);
    } else {
      setSelectedSalesItems(filteredItems.map(i => i.id));
    }
  };

  // UI State for mobile
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilterClosing, setMobileFilterClosing] = useState(false);

  const closeMobileFilter = () => {
    setMobileFilterClosing(true);
    setTimeout(() => {
      setShowMobileFilter(false);
      setMobileFilterClosing(false);
    }, 300);
  };

  const stats = React.useMemo(() => {
    const totalVND = salesItems.reduce((acc, item) => acc + (item.currency === 'VND' ? item.total : item.total * item.exchange_rate), 0);
    const totalUSD = salesItems.reduce((acc, item) => acc + (item.currency === 'USD' ? item.total : item.total / (item.exchange_rate || 1)), 0);
    const avgTax = salesItems.length > 0 ? (salesItems.reduce((acc, item) => acc + item.tax_percent, 0) / salesItems.length) : 0;

    // Currency Distribution (Count of items)
    const currencyValueData = [
      { name: 'VND', val: salesItems.filter(i => i.currency === 'VND').length },
      { name: 'USD', val: salesItems.filter(i => i.currency === 'USD').length },
    ];

    // Sales by Shipment (Top 5)
    const shipmentMap = new Map<string, number>();
    salesItems.forEach(item => {
      const val = item.currency === 'VND' ? item.total : item.total * item.exchange_rate;
      shipmentMap.set(item.shipment_id, (shipmentMap.get(item.shipment_id) || 0) + val);
    });
    const shipmentData = Array.from(shipmentMap.entries())
      .map(([id, val]) => ({ name: id.slice(0, 8), val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    // Supplier performance
    const supplierMap = new Map<string, { name: string, totalVND: number, count: number }>();
    salesItems.forEach(item => {
      const supplierName = item.shipments?.suppliers?.company_name || 'Individual / Regular';
      const val = item.currency === 'VND' ? item.total : item.total * item.exchange_rate;
      const current = supplierMap.get(supplierName) || { name: supplierName, totalVND: 0, count: 0 };
      supplierMap.set(supplierName, {
        name: supplierName,
        totalVND: current.totalVND + val,
        count: current.count + 1
      });
    });
    const supplierStats = Array.from(supplierMap.values())
      .sort((a, b) => b.totalVND - a.totalVND)
      .slice(0, 5);

    return { totalVND, totalUSD, avgTax, currencyValueData, shipmentData, supplierStats };
  }, [salesItems]);

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 mx-4 mt-4">
        <Calculator className="mx-auto mb-2 opacity-40" />
        {error}
      </div>
    );
  }

  const hasActiveFilters = selectedCurrencies.length > 0 || selectedSuppliers.length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      {/* Tabs */}
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
          {/* MOBILE TOOLBAR */}
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <button onClick={() => navigate('/financials')} className="p-2 rounded-xl border border-border bg-white text-muted-foreground transition-all active:scale-95"><ChevronLeft size={18} /></button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
              />
            </div>
            <button
              onClick={() => setShowMobileFilter(true)}
              className={clsx(
                'p-2 rounded-xl border transition-all active:scale-95',
                hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-muted-foreground'
              )}
            >
              <Calculator size={18} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition-all active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-50/30">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border p-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-50 rounded w-2/3" />
                </div>
              ))
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-muted-foreground italic bg-white rounded-2xl border border-dashed border-border mx-2">
                No items found
              </div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm active:border-primary/40 transition-all group relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex flex-col gap-1 pr-12 min-w-0">
                      <span className="text-[10px] font-mono font-black text-primary uppercase tracking-tighter opacity-70">#{item.shipment_id?.slice(0, 8)}</span>
                      <span className="text-[14px] font-bold text-slate-900 leading-tight line-clamp-2">{item.description || 'No Description'}</span>
                      <span className="text-[11px] text-muted-foreground font-medium underline mt-1">{item.unit} x {item.quantity}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">{item.tax_percent}% TAX</span>
                      <span className="text-[15px] font-black text-primary tabular-nums">{new Intl.NumberFormat('en-US').format(item.total)} {item.currency}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-50">
                    <button onClick={() => handleOpenEdit(item)} className="p-2 rounded-xl bg-slate-50 text-slate-600 active:bg-primary/10 active:text-primary transition-all"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-xl bg-red-50 text-red-400 active:bg-red-500 active:text-white transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TOOLBAR */}
          <div className="hidden md:block p-4 space-y-4 border-b border-border/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => navigate('/financials')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0 font-inter"><ChevronLeft size={16} />Back</button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search description, shipment ID..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
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
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 font-inter"
                >
                  <Plus size={16} />
                  New Item
                </button>
              </div>
            </div>

            {/* Secondary Filters */}
            <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'currency' ? null : 'currency');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'currency' || selectedCurrencies.length > 0 ? "bg-primary/5 border-primary text-primary" : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <DollarSign size={14} className={clsx(activeDropdown === 'currency' || selectedCurrencies.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Currency
                  {selectedCurrencies.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedCurrencies.length}</span>}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'currency' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'currency'}
                  options={['VND', 'USD'].map(curr => ({ id: curr, label: curr === 'VND' ? 'Vietnamese Dong (VND)' : 'US Dollar (USD)', count: salesItems.filter(i => i.currency === curr).length }))}
                  selected={selectedCurrencies}
                  onToggle={toggleCurrency}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'supplier' ? null : 'supplier');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'supplier' || selectedSuppliers.length > 0 ? "bg-primary/5 border-primary text-primary" : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Building2 size={14} className={clsx(activeDropdown === 'supplier' || selectedSuppliers.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Supplier
                  {selectedSuppliers.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedSuppliers.length}</span>}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'supplier' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'supplier'}
                  options={suppliers.map(s => ({
                    id: s.id,
                    label: s.company_name,
                    count: salesItems.filter(i => i.shipments?.supplier_id === s.id).length
                  }))}
                  selected={selectedSuppliers}
                  onToggle={toggleSupplier}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              {(selectedCurrencies.length > 0 || selectedSuppliers.length > 0) && (
                <button
                  onClick={() => { setSelectedCurrencies([]); setSelectedSuppliers([]); }}
                  className="text-[12px] text-muted-foreground hover:text-primary font-bold px-3 py-1 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSalesItems.length === filteredItems.length && filteredItems.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                      <th key={key} className={clsx(COLUMN_DEFS[key].thClass, "border-b border-border/40")}>{COLUMN_DEFS[key].label}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={visibleColumns.length + 2} className="px-4 py-6 bg-slate-50/10 border-b border-border/40"></td>
                    </tr>
                  )) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 2} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No sales items found.</td>
                    </tr>
                  ) : filteredItems.map(item => (
                    <tr
                      key={item.id}
                      className={clsx(
                        'hover:bg-slate-50/60 transition-colors group',
                        selectedSalesItems.includes(item.id) && 'bg-primary/[0.02]'
                      )}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40">
                        <input
                          type="checkbox"
                          checked={selectedSalesItems.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-border"
                        />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(item)}</td>
                      ))}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 transition-all"
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

            {/* PAGINATION FOOTER */}
            <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-[12px] font-medium text-slate-500">Showing <b>1</b> – <b>{filteredItems.length}</b> of <b>{filteredItems.length}</b> result(s)</span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Prev</button>
                <button className="px-4 py-1.5 rounded-lg border border-border bg-primary text-white text-[12px] font-bold shadow-sm ring-1 ring-primary/20 transition-all">1</button>
                <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STATISTICS TAB content */
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Items', val: salesItems.length, icon: List, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Total Value (VND)', val: new Intl.NumberFormat('vi-VN').format(Math.round(stats.totalVND)), icon: Calculator, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'Total Value (USD)', val: '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(stats.totalUSD), icon: BadgeDollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
              { label: 'Avg Tax Rate', val: stats.avgTax.toFixed(1) + '%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100/50' },
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
            {/* Currency Chart */}
            <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BadgeDollarSign size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Currency Distribution</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.currencyValueData}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="val"
                    >
                      <Cell fill="#3b82f6" stroke="none" />
                      <Cell fill="#10b981" stroke="none" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">VND</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">USD</span></div>
              </div>
            </div>

            {/* Shipment Chart */}
            <div className="md:col-span-2 bg-white rounded-[2rem] border border-border shadow-sm p-6 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Top Shipments by Value (VND)</span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.shipmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }} />
                    <Bar dataKey="val" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Supplier Performance */}
          <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider leading-none">Top Suppliers Performance</span>
              <Building2 size={16} className="text-primary" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-6 py-3 font-bold uppercase tracking-tight">Supplier</th>
                    <th className="px-6 py-3 font-bold uppercase text-right tracking-tight w-24">Items</th>
                    <th className="px-6 py-3 font-bold uppercase text-right tracking-tight w-48">Revenue (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.supplierStats.length > 0 ? stats.supplierStats.map(sup => (
                    <tr key={sup.name} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 group-hover:text-primary transition-colors">{sup.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">Logistics Partner</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right"><span className="text-[13px] font-black text-primary tabular-nums">{sup.count}</span></td>
                      <td className="px-6 py-4 text-right"><span className="text-[13px] font-black text-slate-900 tabular-nums">{new Intl.NumberFormat('vi-VN').format(Math.round(sup.totalVND))} ₫</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic text-[13px]">No supplier data available yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FILTER BOTTOM SHEET (PORTAL) */}
      {showMobileFilter && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end">
          <div className={clsx('absolute inset-0 bg-black/40 transition-opacity', mobileFilterClosing ? 'opacity-0' : 'opacity-100')} onClick={closeMobileFilter} />
          <div className={clsx('relative bg-white rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl', mobileFilterClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom')}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="text-[16px] font-bold">Filters</span>
              <button onClick={closeMobileFilter} className="p-1.5 text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3">Currency</h3>
                <div className="flex flex-wrap gap-2">
                  {['VND', 'USD'].map(curr => (
                    <button
                      key={curr}
                      onClick={() => toggleCurrency(curr)}
                      className={clsx('px-4 py-2 rounded-xl border text-[13px] font-bold transition-all', selectedCurrencies.includes(curr) ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-600 border-slate-200')}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3">Supplier</h3>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {suppliers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleSupplier(s.id)}
                      className={clsx(
                        'px-4 py-3 rounded-xl border text-[13px] font-bold transition-all text-left flex items-center justify-between',
                        selectedSuppliers.includes(s.id) ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-600 border-slate-200'
                      )}
                    >
                      <span className="truncate">{s.company_name}</span>
                      {selectedSuppliers.includes(s.id) && <div className="w-2 h-2 rounded-full bg-white shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-white flex flex-col gap-2">
              <button onClick={() => { setSelectedCurrencies([]); setSelectedSuppliers([]); closeMobileFilter(); }} className="w-full py-3 rounded-2xl border border-red-300 text-red-500 text-[14px] font-bold transition-all active:bg-red-50">Clear All</button>
              <button onClick={closeMobileFilter} className="w-full py-4 rounded-2xl bg-primary text-white text-[15px] font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">Apply Filters</button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ADD/EDIT DIALOG */}
      <AddEditSalesDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        shipmentOptions={shipments}
        onSave={handleSave}
      />
    </div>
  );
};

export default SalesPage;
