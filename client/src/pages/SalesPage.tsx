import React, { useState, useEffect, useRef } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus, List,
  Edit, Trash2, RefreshCcw,
  BadgeDollarSign, TrendingUp,
  BarChart2, Calculator, DollarSign, ChevronRight, X, Building2, Printer, CheckCircle2, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { salesService } from '../services/salesService';
import { shipmentService } from '../services/shipmentService';
import { supplierService } from '../services/supplierService';
import type { Supplier } from '../services/supplierService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import type { Sales, SalesFormState } from './sales/types';
import type { Shipment } from './shipments/types';
import SalesDialog from './sales/dialogs/SalesDialog';
import { exchangeRateService, type ExchangeRate } from '../services/exchangeRateService';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useToastContext } from '../contexts/ToastContext';

const INITIAL_FORM_STATE: SalesFormState = {
  shipment_id: '',
  items: [],
};

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (s: Sales) => React.ReactNode };
const COLUMN_DEFS: Record<string, ColDef> = {
  shipment: {
    label: 'Quotation',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-bold text-primary',
    renderContent: (s) => (
      <div className="flex flex-col">
        <span>{s.no_doc || `Q-${s.id.slice(0, 8)}`}</span>
        <span className="text-[10px] text-muted-foreground">{s.shipments?.code || '—'}</span>
      </div>
    )
  },
  description: {
    label: 'Overview',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => {
      const items = s.sales_items || [];
      const desc = items.length > 0 ? items[0].description : '—';
      return (
        <div className="flex flex-col max-w-xs xl:max-w-md">
          <span className="text-[13px] font-bold text-foreground line-clamp-1">{desc}</span>
          <span className="text-[11px] text-muted-foreground opacity-70 italic">{items.length} product(s)</span>
        </div>
      );
    }
  },
  total: {
    label: 'Total',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-64 text-right',
    tdClass: 'px-4 py-4 text-right font-black text-[14px] text-primary tabular-nums',
    renderContent: (s) => {
      const sum = (s.sales_items || []).reduce((acc, i) => acc + (i.total || 0), 0);
      return <span>{new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(sum)} VND</span>;
    }
  }
};
const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [salesItems, setSalesItems] = useState<Sales[]>([]);
  const [selectedSalesItems, setSelectedSalesItems] = useState<string[]>([]);
  const [shipments, setShipments] = useState<(Shipment & { value: string, label: string })[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [mode, setMode] = useState<'add' | 'edit' | 'detail'>('add');
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
    fetchExchangeRates();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data: any = await salesService.getSalesItems(1, 100);
      setSalesItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : (err?.message || 'Failed to fetch sales items'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const rates = await exchangeRateService.getAll();
      setExchangeRates(rates || []);
    } catch (err: any) {
      console.error('Failed to fetch exchange rates:', err);
    }
  };

  const fetchShipmentOptions = async () => {
    try {
      const data: any = await shipmentService.getShipments(1, 100);
      const shipmentsData = Array.isArray(data) ? data : data.data || [];
      setShipments(shipmentsData.map((s: any) => ({
        ...s, value: s.id,
        label: `${s.code || '#' + s.id.slice(0, 8)} - ${s.customers?.company_name || 'No Customer'}`
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
    setMode('add');
    setIsDialogOpen(true);
  };

  const setFormStateFromItem = (item: Sales) => {
    setFormState({
      id: item.id,
      shipment_id: item.shipment_id,
      items: item.sales_items?.map(si => ({
        id: si.id,
        description: si.description,
        rate: si.rate,
        quantity: si.quantity,
        unit: si.unit,
        currency: si.currency,
        exchange_rate: si.exchange_rate,
        tax_percent: si.tax_percent,
      })) || [],
      relatedShipment: item.shipments,
    });
  };

  const handleOpenEdit = (item: Sales) => {
    setFormStateFromItem(item);
    setMode('edit');
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (item: Sales) => {
    setFormStateFromItem(item);
    setMode('detail');
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
        toastError('Please select a shipment');
        return;
      }
      if (mode === 'edit' && formState.id) {
        await salesService.updateSalesItem(formState.id, formState);
      } else if (mode === 'add') {
        await salesService.createSalesItem(formState);
      }
      handleCloseDialog();
      fetchData();
      toastSuccess(mode === 'edit' ? 'Sales item updated successfully' : 'Sales item created successfully');
    } catch (err: any) {
      console.error('Failed to save sales item:', err);
      toastError(err instanceof Error ? err.message : (err?.message || 'Failed to save sales item. Please check your data.'));
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
        await salesService.deleteSalesItem(confirmAction.id);
        toastSuccess('Sales item deleted successfully');
        if (selectedSalesItems.includes(confirmAction.id)) {
          setSelectedSalesItems(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedSalesItems.map(id => salesService.deleteSalesItem(id)));
        toastSuccess(`${selectedSalesItems.length} sales items deleted successfully`);
        setSelectedSalesItems([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      toastError(err instanceof Error ? err.message : (err?.message || 'Failed to delete sales item(s)'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = salesItems.filter(item => {
    // Text search
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesText =
        item.sales_items?.some(i => i.description?.toLowerCase().includes(search)) ||
        item.shipment_id?.toLowerCase().includes(search) ||
        item.no_doc?.toLowerCase().includes(search);
      if (!matchesText) return false;
    }

    // Currency filter
    if (selectedCurrencies.length > 0) {
      const hasCurrency = item.sales_items?.some(i => selectedCurrencies.includes(i.currency));
      if (!hasCurrency) return false;
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
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>('currency');
  const [pendingCurrencies, setPendingCurrencies] = useState<string[]>([]);
  const [pendingSuppliers, setPendingSuppliers] = useState<string[]>([]);

  const closeMobileFilter = () => {
    setMobileFilterClosing(true);
    setTimeout(() => {
      setShowMobileFilter(false);
      setMobileFilterClosing(false);
    }, 280);
  };

  const openMobileFilter = () => {
    setPendingCurrencies(selectedCurrencies);
    setPendingSuppliers(selectedSuppliers);
    setMobileExpandedSection('currency');
    setShowMobileFilter(true);
  };

  const applyMobileFilter = () => {
    setSelectedCurrencies(pendingCurrencies);
    setSelectedSuppliers(pendingSuppliers);
    closeMobileFilter();
  };

  const stats = React.useMemo(() => {
    const totalVND = filteredItems.reduce((acc, item) => acc + (item.sales_items?.reduce((sum, i) => sum + (i.total || 0), 0) || 0), 0);
    const activeUsdRate = exchangeRates.find(r => r.currency_code === 'USD')?.rate || 25450;
    const totalUSD = totalVND / activeUsdRate;

    const allItems = filteredItems.flatMap(i => i.sales_items || []);
    const avgTax = allItems.length > 0 ? (allItems.reduce((acc, item) => acc + (item.tax_percent || 0), 0) / allItems.length) : 0;

    // Currency Distribution (Count of items)
    const currencyValueData = [
      { name: 'VND', val: allItems.filter(i => i.currency === 'VND').length },
      { name: 'USD', val: allItems.filter(i => i.currency === 'USD').length },
    ];

    // Sales by Shipment (Top 5)
    const shipmentMap = new Map<string, { code: string, val: number }>();
    filteredItems.forEach(item => {
      const val = item.sales_items?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
      const code = item.shipments?.code || `#${item.shipment_id?.slice(0, 8)}`;
      const current = shipmentMap.get(item.shipment_id) || { code, val: 0 };
      current.val += val;
      shipmentMap.set(item.shipment_id, current);
    });
    const shipmentData = Array.from(shipmentMap.values())
      .map(data => ({
        name: data.code.length > 12 ? data.code.slice(0, 12) + '...' : data.code,
        fullName: data.code,
        val: data.val
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    // Supplier performance
    const supplierMap = new Map<string, { name: string, totalVND: number, count: number }>();
    filteredItems.forEach(item => {
      const supplierName = item.shipments?.suppliers?.company_name || 'Individual / Regular';
      const val = item.sales_items?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
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
  }, [filteredItems]);

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
              onClick={openMobileFilter}
              className={clsx(
                'p-2 rounded-xl border transition-all active:scale-95 relative',
                hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-muted-foreground'
              )}
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {selectedCurrencies.length + selectedSuppliers.length}
                </span>
              )}
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
              filteredItems.map(item => {
                const quoteItems = item.sales_items || [];
                const total = quoteItems.reduce((acc, i) => acc + (i.total || 0), 0);
                const desc = quoteItems.length > 0 ? quoteItems[0].description : 'No Products';
                const countText = quoteItems.length > 1 ? `+${quoteItems.length - 1} more items` : (quoteItems[0]?.unit ? `${quoteItems[0].quantity} x ${quoteItems[0].unit}` : '');

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className="bg-white rounded-2xl border border-border p-4 shadow-sm active:border-primary/40 transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex flex-col gap-1 pr-12 min-w-0">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter opacity-70">{item.shipments?.code || `#${item.shipment_id?.slice(0, 8)}`}</span>
                        <span className="text-[14px] font-bold text-slate-900 leading-tight line-clamp-2">{desc}</span>
                        <span className="text-[11px] text-muted-foreground font-medium underline mt-1">{countText}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">{quoteItems.length} Products</span>
                        <span className="text-[15px] font-black text-primary tabular-nums">{new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(total)} VND</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-50">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        className="p-2 rounded-xl bg-slate-50 text-slate-600 active:bg-primary/10 active:text-primary transition-all"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(item.id, e)}
                        className="p-2 rounded-xl bg-red-50 text-red-400 active:bg-red-500 active:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
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
                {selectedSalesItems.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <Trash2 size={16} />
                      Delete ({selectedSalesItems.length})
                    </button>
                    <button
                      onClick={() => setSelectedSalesItems([])}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-xl text-[12px] font-bold border border-border hover:bg-slate-50 transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <X size={16} />
                      Clear
                    </button>
                  </>
                )}
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
                  options={['VND', 'USD'].map(curr => ({ id: curr, label: curr === 'VND' ? 'Vietnamese Dong (VND)' : 'US Dollar (USD)', count: salesItems.filter(i => i.sales_items?.some(si => si.currency === curr)).length }))}
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
                      onClick={() => handleOpenDetail(item)}
                      className={clsx(
                        'hover:bg-slate-50/60 transition-colors group cursor-pointer',
                        selectedSalesItems.includes(item.id) && 'bg-primary/[0.02]'
                      )}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={(e) => e.stopPropagation()}>
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
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/financials/sales/quotation/${item.id}`)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-all font-bold"
                            title="Print Quotation"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(item.id, e)}
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
        /* STATISTICS TAB */
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 animate-in fade-in duration-300">
          {/* ── MOBILE STATS TOOLBAR ── */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-border shrink-0 relative">
            <button
              onClick={() => navigate('/financials')}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[14px] font-bold text-slate-900 whitespace-nowrap">Financial Overview</span>
            <button
              onClick={openMobileFilter}
              className="relative p-2 rounded-xl border border-border bg-white text-muted-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {selectedCurrencies.length + selectedSuppliers.length}
                </span>
              )}
            </button>
          </div>

          {/* ── DESKTOP STATS TOOLBAR ── */}
          <div className="hidden md:block p-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
              <button
                onClick={() => navigate('/financials')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="w-px h-5 bg-border mx-1" />

              <div className="relative">
                <button
                  onClick={() => { setActiveDropdown(activeDropdown === 'currency' ? null : 'currency'); setFilterSearch(''); }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold',
                    activeDropdown === 'currency' || selectedCurrencies.length > 0
                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <DollarSign size={14} className={clsx(activeDropdown === 'currency' || selectedCurrencies.length > 0 ? 'text-primary' : 'text-muted-foreground/50')} />
                  Currency
                  {selectedCurrencies.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedCurrencies.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'currency' ? '-rotate-90' : 'rotate-90')} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'currency'}
                  options={['VND', 'USD'].map(curr => ({
                    id: curr,
                    label: curr === 'VND' ? 'Vietnamese Dong (VND)' : 'US Dollar (USD)',
                    count: salesItems.filter(i => i.sales_items?.some(si => si.currency === curr)).length
                  }))}
                  selected={selectedCurrencies}
                  onToggle={toggleCurrency}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => { setActiveDropdown(activeDropdown === 'supplier' ? null : 'supplier'); setFilterSearch(''); }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold',
                    activeDropdown === 'supplier' || selectedSuppliers.length > 0
                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Building2 size={14} className={clsx(activeDropdown === 'supplier' || selectedSuppliers.length > 0 ? 'text-primary' : 'text-muted-foreground/50')} />
                  Supplier
                  {selectedSuppliers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedSuppliers.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'supplier' ? '-rotate-90' : 'rotate-90')} />
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

              {hasActiveFilters && (
                <button
                  onClick={() => { setSelectedCurrencies([]); setSelectedSuppliers([]); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-red-300 text-red-500 text-[12px] font-bold hover:bg-red-50 transition-all"
                >
                  <X size={13} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Scrollable stats body */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 md:gap-4 no-scrollbar bg-slate-50/10">
            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Items', value: filteredItems.length, icon: <List size={18} />, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                { label: 'Total (VND)', value: new Intl.NumberFormat('vi-VN').format(Math.round(stats.totalVND)), icon: <Calculator size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'Total (USD)', value: '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(stats.totalUSD), icon: <BadgeDollarSign size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
                { label: 'Avg Tax', value: stats.avgTax.toFixed(1) + '%', icon: <TrendingUp size={18} />, color: 'text-orange-600', bg: 'bg-orange-500/10' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 flex items-center gap-3 md:gap-4">
                  <div className={clsx('w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0', item.bg, item.color)}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide leading-none mb-1">{item.label}</p>
                    <p className={clsx('text-[16px] md:text-xl font-black tabular-nums truncate', item.color)} title={item.value.toString()}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* PieChart – Currency Distribution */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 h-[280px] flex flex-col">
                <div className="flex items-center gap-2 mb-4 shrink-0">
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
                <div className="flex justify-center gap-4 mt-2 shrink-0">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] font-bold text-slate-500 uppercase font-inter">VND</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500 uppercase font-inter">USD</span></div>
                </div>
              </div>

              {/* BarChart – Top Shipments by Value */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 md:p-6 h-[280px] flex flex-col">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <TrendingUp size={15} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Top Shipments by Value (VND)</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.shipmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }}
                        formatter={(v, _, props) => [new Intl.NumberFormat('vi-VN').format(v as number) + ' ₫', (props.payload as { fullName?: string })?.fullName ?? '']}
                      />
                      <Bar dataKey="val" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Supplier Performance */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider leading-none">Top Suppliers Performance</span>
                </div>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] text-muted-foreground border-b border-border/60">
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
                      <tr><td colSpan={3} className="px-6 py-20 text-center text-muted-foreground italic text-[13px]">No supplier data available for the current filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FILTER BOTTOM SHEET (PORTAL) */}
      {showMobileFilter && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex flex-col justify-end">
          <div className={clsx('absolute inset-0 bg-black/40 transition-opacity duration-300', mobileFilterClosing ? 'opacity-0' : 'opacity-100')} onClick={closeMobileFilter} />
          <div className={clsx('relative bg-white rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl', mobileFilterClosing ? 'animate-out slide-out-to-bottom duration-300' : 'animate-in slide-in-from-bottom duration-300')}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-primary" />
                <span className="text-[17px] font-bold">Filters</span>
              </div>
              <button onClick={closeMobileFilter} className="p-1.5 text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border/60">
                {/* Currency Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'currency' ? null : 'currency')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">Currency</span>
                      {pendingCurrencies.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingCurrencies.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'currency' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'currency' && (
                    <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {['VND', 'USD'].map(curr => (
                        <button
                          key={curr}
                          onClick={() => setPendingCurrencies(prev => prev.includes(curr) ? prev.filter(c => c !== curr) : [...prev, curr])}
                          className={clsx(
                            'px-4 py-2 rounded-xl border text-[13px] font-bold transition-all',
                            pendingCurrencies.includes(curr) ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-slate-50 text-slate-600 border-slate-200'
                          )}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supplier Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'supplier' ? null : 'supplier')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">Supplier</span>
                      {pendingSuppliers.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingSuppliers.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'supplier' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'supplier' && (
                    <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {suppliers.map(s => {
                        const isSelected = pendingSuppliers.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setPendingSuppliers(prev => isSelected ? prev.filter(v => v !== s.id) : [...prev, s.id])}
                            className={clsx(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                              isSelected ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                            )}
                          >
                            <span className="text-[13px] font-bold truncate pr-4">{s.company_name}</span>
                            <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', isSelected ? 'bg-primary border-primary' : 'border-slate-300')}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-white flex flex-col gap-2">
              <button
                onClick={() => {
                  setPendingCurrencies([]);
                  setPendingSuppliers([]);
                }}
                className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-[14px] font-bold hover:bg-red-50 transition-all active:scale-95"
              >
                Clear All
              </button>
              <button
                onClick={applyMobileFilter}
                className="w-full py-4 rounded-2xl bg-primary text-white text-[15px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ADD/EDIT DIALOG */}
      <SalesDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        mode={mode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        shipmentOptions={shipments}
        exchangeRates={exchangeRates}
        onSave={handleSave}
        onEdit={() => setMode('edit')}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isProcessing={isDeleting}
        message={
          <>
            Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedSalesItems.length} sales items` : 'this sales item'}?
            All associated data will be permanently removed.
          </>
        }
      />
    </div>
  );
};

export default SalesPage;

