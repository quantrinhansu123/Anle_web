import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus,
  Edit, Trash2, List, BarChart2,
  RefreshCcw, DollarSign, Package,
  TrendingUp, Users, RotateCcw,
  ChevronRight, Truck, AlertCircle, X,
  CheckCircle2, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { purchasingService, type PurchasingItem, type CreatePurchasingItemDto } from '../services/purchasingService';
import { shipmentService } from '../services/shipmentService';
import { supplierService } from '../services/supplierService';
import { employeeService } from '../services/employeeService';
import { salesService } from '../services/salesService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import PurchasingDialog from './purchasing/dialogs/PurchasingDialog';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useToastContext } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

// --- CONFIGURATION ---
type ColDef = {
  label: string;
  thClass: string;
  tdClass: string;
  renderContent: (item: PurchasingItem) => React.ReactNode
};

const COLUMN_DEFS: Record<string, ColDef> = {
  supplier_id: {
    label: 'Supplier ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-32',
    tdClass: 'px-4 py-4 border-r border-border/40 font-mono text-[12px] font-bold text-primary',
    renderContent: (item) => <span>{item.supplier_id}</span>
  },
  shipment_id: {
    label: 'Shipment ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-32',
    tdClass: 'px-4 py-4 border-r border-border/40 font-mono text-[12px] text-slate-500',
    renderContent: (item) => <span>{item.shipments?.code || `#${item.shipment_id.slice(0, 8)}`}</span>
  },
  supplier_name: {
    label: 'Supplier Name',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-56',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] font-medium text-slate-700',
    renderContent: (item) => <span>{item.suppliers?.company_name || '—'}</span>
  },
  description: {
    label: 'Description',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-64',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-slate-600 max-w-xs truncate',
    renderContent: (item) => <span>{item.description}</span>
  },
  hs_code: {
    label: 'HS Code',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-32',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] text-slate-500',
    renderContent: (item) => <span>{item.hs_code || '—'}</span>
  },
  cost: {
    label: 'Cost',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-r border-border/40 w-40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] font-bold text-primary text-center tabular-nums',
    renderContent: (item) => (
      <span>
        {item.total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        <span className="ml-1 text-[10px] opacity-50 font-normal">VND</span>
      </span>
    )
  },
  tax_percent: {
    label: 'Tax %',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-r border-border/40 w-24',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-slate-500 text-center',
    renderContent: (item) => <span>{item.tax_percent}%</span>
  },
  tax_value: {
    label: 'Tax Value',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-r border-border/40 w-32',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-slate-500 text-center tabular-nums',
    renderContent: (item) => <span>{item.tax_value?.toLocaleString()}</span>
  },
  pic: {
    label: 'PIC',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-48',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-slate-600',
    renderContent: (item) => <span>{item.pic?.full_name || '—'}</span>
  },
  creator: {
    label: 'Creator',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-48',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-slate-600',
    renderContent: (item) => <span>{item.creator?.full_name || '—'}</span>
  },
  approver: {
    label: 'Approver',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-48',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-slate-600',
    renderContent: (item) => <span>{item.approver?.full_name || '—'}</span>
  }
};

const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const INITIAL_FORM_STATE: Partial<PurchasingItem> = {
  shipment_id: '',
  supplier_id: '',
  description: '',
  hs_code: '',
  rate: 0,
  quantity: 0,
  unit: '',
  currency: 'USD',
  exchange_rate: 1,
  tax_percent: 0,
  specification: '',
  note: ''
};

const PurchasingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [purchasingItems, setPurchasingItems] = useState<PurchasingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Column Customization
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);

  // Filters State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedPics, setSelectedPics] = useState<string[]>([]);
  const [selectedHsCodes, setSelectedHsCodes] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile Filter sheet
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilterClosing, setMobileFilterClosing] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>('supplier');
  const [pendingSuppliers, setPendingSuppliers] = useState<string[]>([]);
  const [pendingPics, setPendingPics] = useState<string[]>([]);
  const [pendingHsCodes, setPendingHsCodes] = useState<string[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'detail'>('add');
  const [formState, setFormState] = useState<Partial<PurchasingItem>>(INITIAL_FORM_STATE);

  // Options
  const [shipmentOptions, setShipmentOptions] = useState<{ value: string, label: string }[]>([]);
  const [fullShipments, setFullShipments] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ value: string, label: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string, label: string }[]>([]);

  useEffect(() => {
    fetchData();
    fetchOptions();

    // Handle click outside for dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await purchasingService.getPurchasingItems(1, 100);
      setPurchasingItems(data);
    } catch (err: any) {
      console.error('Failed to fetch purchasing items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [shipments, suppliers, employees] = await Promise.all([
        shipmentService.getShipments(1, 1000),
        supplierService.getSuppliers(),
        employeeService.getEmployees()
      ]);
      setFullShipments(shipments);
      setShipmentOptions(shipments.map(s => ({ value: s.id, label: `${s.code || '#' + s.id.slice(0, 8)} - ${s.commodity}` })));
      setSupplierOptions(suppliers.map(s => ({ value: s.id, label: s.company_name })));
      setEmployeeOptions(employees.map(e => ({ value: e.id, label: e.full_name })));
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const setFormField = (key: keyof CreatePurchasingItemDto, value: any) => {
    setFormState(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'shipment_id' && value) {
        const shipment = fullShipments.find(s => s.id === value);
        if (shipment && shipment.supplier_id) {
          next.supplier_id = shipment.supplier_id;
        }
      }
      return next;
    });
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: PurchasingItem) => {
    setFormState(item);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (item: PurchasingItem) => {
    setFormState(item);
    setDialogMode('detail');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDialogOpen(false);
      setIsClosing(false);
    }, 350);
  };

  const handleSave = async (pushToSales?: boolean) => {
    try {
      if (dialogMode === 'edit' && formState.id) {
        const updatePayload = {
          ...formState,
          created_by_id: formState.created_by_id || user?.id
        };
        await purchasingService.updatePurchasingItem(formState.id, updatePayload as any);
      } else {
        const createPayload = {
          ...formState,
          created_by_id: formState.created_by_id || user?.id
        };
        await purchasingService.createPurchasingItem(createPayload as any);
      }

      if (pushToSales && dialogMode === 'add') {
        try {
          await salesService.createSalesItem({
            shipment_id: formState.shipment_id!,
            items: [{
              description: formState.description || '',
              rate: formState.rate || 0,
              quantity: formState.quantity || 0,
              unit: formState.unit || '',
              currency: formState.currency || 'VND',
              exchange_rate: formState.exchange_rate || 1,
              tax_percent: formState.tax_percent || 0
            }]
          });
          toastSuccess('Purchasing and Sales Quote created successfully');
        } catch (salesErr) {
          console.error('Failed to create sales item:', salesErr);
          toastError('Purchasing created, but failed to create Sales Quote');
        }
      } else {
        toastSuccess(dialogMode === 'edit' ? 'Purchasing item updated successfully' : 'Purchasing item created successfully');
      }

      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      console.error('Failed to save:', err);
      toastError(err instanceof Error ? err.message : (err?.message || 'Failed to save purchasing item'));
    }
  };

  const handlePushSelectionToSales = async () => {
    try {
      const selected = purchasingItems.filter(i => selectedItems.includes(i.id));
      if (selected.length === 0) return;

      let successCount = 0;
      await Promise.all(selected.map(async (item) => {
        try {
          await salesService.createSalesItem({
            shipment_id: item.shipment_id,
            items: [{
              description: item.description,
              rate: item.rate,
              quantity: item.quantity,
              unit: item.unit,
              currency: item.currency,
              exchange_rate: item.exchange_rate,
              tax_percent: item.tax_percent
            }]
          });
          successCount++;
        } catch (e: any) {
          console.error('Failed to push item to sales:', e);
        }
      }));

      if (successCount === selected.length) {
        toastSuccess(`Successfully pushed ${successCount} items to Sales Quotation`);
      } else {
        toastError(`Pushed ${successCount} items, but failed ${selected.length - successCount} items.`);
      }
      setSelectedItems([]);
    } catch (err) {
      console.error('Error pushing selection to sales:', err);
      toastError('An error occurred while pushing to Sales Dashboard');
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
        await purchasingService.deletePurchasingItem(confirmAction.id);
        toastSuccess('Purchasing item deleted successfully');
        if (selectedItems.includes(confirmAction.id)) {
          setSelectedItems(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedItems.map(id => purchasingService.deletePurchasingItem(id)));
        toastSuccess(`${selectedItems.length} items deleted successfully`);
        setSelectedItems([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      toastError(err instanceof Error ? err.message : (err?.message || 'Failed to delete item(s)'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = purchasingItems.filter(item => {
    const search = searchText.toLowerCase();
    const searchMatch = (
      item.description.toLowerCase().includes(search) ||
      item.suppliers?.company_name?.toLowerCase().includes(search) ||
      item.shipment_id.toLowerCase().includes(search) ||
      item.id.toLowerCase().includes(search)
    );

    const supplierMatch = selectedSuppliers.length === 0 || selectedSuppliers.includes(item.supplier_id);
    const picMatch = selectedPics.length === 0 || (item.pic_id && selectedPics.includes(item.pic_id));
    const hsMatch = selectedHsCodes.length === 0 || (item.hs_code && selectedHsCodes.includes(item.hs_code));

    return searchMatch && supplierMatch && picMatch && hsMatch;
  });

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const closeMobileFilter = () => {
    setMobileFilterClosing(true);
    setTimeout(() => {
      setShowMobileFilter(false);
      setMobileFilterClosing(false);
    }, 280);
  };

  const openMobileFilter = () => {
    setPendingSuppliers(selectedSuppliers);
    setPendingPics(selectedPics);
    setPendingHsCodes(selectedHsCodes);
    setMobileExpandedSection('supplier');
    setShowMobileFilter(true);
  };

  const applyMobileFilter = () => {
    setSelectedSuppliers(pendingSuppliers);
    setSelectedPics(pendingPics);
    setSelectedHsCodes(pendingHsCodes);
    closeMobileFilter();
  };

  const hasActiveFilters = selectedSuppliers.length > 0 || selectedPics.length > 0 || selectedHsCodes.length > 0;

  // Table Footer Stats
  const pageTotalCost = filteredItems.reduce((acc, item) => acc + (item.total || 0), 0);

  // Stats calculations for Dashboard
  const totalCostVND = purchasingItems.reduce((acc, item) => acc + (item.total || 0), 0);
  const itemsBySupplier = purchasingItems.reduce((acc: any, item) => {
    const name = item.suppliers?.company_name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const supplierChartData = Object.entries(itemsBySupplier).map(([name, val]) => ({ name, val }));

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
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* MOBILE TOOLBAR */}
          <div className="md:hidden flex items-center gap-2 p-3 border-b border-border">
            <button onClick={() => navigate('/financials')} className="p-2 rounded-xl border border-border bg-white text-muted-foreground active:scale-95"><ChevronLeft size={18} /></button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                type="text"
                placeholder="Search purchasing..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium focus:bg-white transition-all outline-none"
              />
            </div>
            <button
              onClick={openMobileFilter}
              className={clsx('p-2 rounded-xl border relative active:scale-95', hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white')}
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {selectedSuppliers.length + selectedPics.length + selectedHsCodes.length}
                </span>
              )}
            </button>
            <button onClick={handleOpenAdd} className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20 active:scale-95"><Plus size={18} /></button>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-50/30">
            {loading ? (
              <div className="py-16 text-center animate-pulse text-muted-foreground italic">Loading Items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-muted-foreground italic">No matching items</div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono font-bold text-primary">{item.shipments?.code || `#${item.shipment_id.slice(0, 8)}`}</span>
                      <span className="text-[14px] font-bold text-slate-900 leading-tight line-clamp-1">{item.suppliers?.company_name || '—'}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[14px] font-black text-primary tabular-nums">
                        {item.total?.toLocaleString()} <span className="text-[9px] font-normal opacity-60 uppercase">VND</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2 truncate pr-4">
                      <Package size={12} className="shrink-0" />
                      <span className="truncate">{item.description}</span>
                    </div>
                    {item.hs_code && <span className="shrink-0 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.hs_code}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TOOLBAR */}
          <div className="hidden md:block p-4 space-y-4">
            {/* Top Row: Search & Main Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                {selectedItems.length > 0 ? (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[12px] font-bold shadow-sm shadow-primary/5">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {selectedItems.length} selected
                    </div>
                    <div className="h-4 w-px bg-border mx-1" />
                    <button
                      onClick={handlePushSelectionToSales}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all active:scale-95 animate-in fade-in slide-in-from-left-2"
                    >
                      <TrendingUp size={13} />
                      Push to Sales ({selectedItems.length})
                    </button>
                    <button
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95 animate-in fade-in slide-in-from-left-2"
                    >
                      <Trash2 size={13} />
                      Delete {selectedItems.length > 1 ? 'Items' : 'Item'} ({selectedItems.length})
                    </button>
                    <button
                      onClick={() => setSelectedItems([])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-slate-600 bg-white border border-border hover:bg-slate-50 transition-all active:scale-95 animate-in fade-in slide-in-from-left-2"
                    >
                      <X size={14} />
                      Clear
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => navigate('/financials')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0 active:scale-95">
                      <ChevronLeft size={16} />Back
                    </button>
                    <div className="relative flex-1 max-w-sm group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder="Search items, suppliers, or shipments..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full pl-10 pr-8 py-1.5 bg-muted/10 border border-border rounded-xl text-[13px] font-medium focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchData} className="px-3 py-1.5 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm">
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
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  New Purchasing
                </button>
              </div>
            </div>

            {/* Bottom Row: Secondary Filters */}
            <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>

              {/* Supplier Filter */}
              <div className="relative" ref={activeDropdown === 'supplier' ? dropdownRef : null}>
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
                  <Truck size={14} className={clsx(activeDropdown === 'supplier' || selectedSuppliers.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Supplier
                  {selectedSuppliers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">{selectedSuppliers.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform opacity-40", activeDropdown === 'supplier' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'supplier'}
                  options={supplierOptions.map(opt => ({
                    id: opt.value,
                    label: opt.label,
                    count: purchasingItems.filter(i => i.supplier_id === opt.value).length
                  }))}
                  selected={selectedSuppliers}
                  onToggle={(id) => setSelectedSuppliers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              {/* PIC Filter */}
              <div className="relative" ref={activeDropdown === 'pic' ? dropdownRef : null}>
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'pic' ? null : 'pic');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'pic' || selectedPics.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Users size={14} className={clsx(activeDropdown === 'pic' || selectedPics.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  PIC
                  {selectedPics.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">{selectedPics.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform opacity-40", activeDropdown === 'pic' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'pic'}
                  options={employeeOptions.map(opt => ({
                    id: opt.value,
                    label: opt.label,
                    count: purchasingItems.filter(i => i.pic_id === opt.value).length
                  }))}
                  selected={selectedPics}
                  onToggle={(id) => setSelectedPics(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              {/* HS Code Filter */}
              <div className="relative" ref={activeDropdown === 'hs' ? dropdownRef : null}>
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'hs' ? null : 'hs');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'hs' || selectedHsCodes.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Package size={14} className={clsx(activeDropdown === 'hs' || selectedHsCodes.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  HS Code
                  {selectedHsCodes.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">{selectedHsCodes.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform opacity-40", activeDropdown === 'hs' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'hs'}
                  options={Array.from(new Set(purchasingItems.map(i => i.hs_code).filter(h => h))).map(hs => ({
                    id: hs!,
                    label: hs!,
                    count: purchasingItems.filter(i => i.hs_code === hs).length
                  }))}
                  selected={selectedHsCodes}
                  onToggle={(id) => setSelectedHsCodes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              {(selectedSuppliers.length > 0 || selectedPics.length > 0 || selectedHsCodes.length > 0) && (
                <button
                  onClick={() => { setSelectedSuppliers([]); setSelectedPics([]); setSelectedHsCodes([]); }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Clear all filters"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border bg-slate-50/20">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                    <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                  ))}
                  <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-border/40 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={visibleColumns.length + 2} className="px-4 py-6 bg-slate-50/10 h-16 border-b border-border/40"></td></tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={visibleColumns.length + 2} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No purchasing items found.</td></tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} onClick={() => handleOpenDetail(item)} className={clsx('hover:bg-slate-50/60 transition-colors group cursor-pointer', selectedItems.includes(item.id) && 'bg-primary/[0.02]')}>
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-border"
                        />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(item)}</td>
                      ))}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="px-6 py-3 border-t border-border bg-slate-50/50 hidden md:flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-medium text-slate-500">
                Showing <b>1</b> – <b>{filteredItems.length}</b> of <b>{filteredItems.length}</b> result(s)
              </span>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Cost:</span>
                <span className="text-[13px] font-black text-primary tabular-nums">
                  {pageTotalCost.toLocaleString()} <span className="text-[10px] font-normal opacity-60">VND</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Prev</button>
              <button className="px-4 py-1.5 rounded-lg border border-border bg-primary text-white text-[12px] font-bold shadow-sm transition-all">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      ) : (
        /* STATS TAB */
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Items', val: purchasingItems.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Total Cost (VND)', val: totalCostVND.toLocaleString(), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'Active Suppliers', val: Object.keys(itemsBySupplier).length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100/50' },
              { label: 'Avg. Tax', val: (purchasingItems.reduce((acc, i) => acc + i.tax_percent, 0) / (purchasingItems.length || 1)).toFixed(1) + '%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
            ].map(card => (
              <div key={card.label} className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3 shadow-slate-200/50">
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
              <div className="flex items-center gap-2 mb-4"><Users size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Breakdown by Supplier</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={supplierChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="val">
                      {supplierChartData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 h-[300px] flex flex-col shadow-slate-200/50">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Cost Distribution</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchasingItems.slice(0, 10).map(i => ({ name: i.description.slice(0, 10), cost: i.total }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}


      <PurchasingDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        mode={dialogMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        shipmentOptions={shipmentOptions}
        supplierOptions={supplierOptions}
        employeeOptions={employeeOptions}
        onSave={handleSave}
        onEdit={() => setDialogMode('edit')}
      />

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
              <button onClick={closeMobileFilter} className="p-1.5 text-muted-foreground hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border/60">
                {/* Supplier Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'supplier' ? null : 'supplier')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">Supplier</span>
                      {pendingSuppliers.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingSuppliers.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'supplier' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'supplier' && (
                    <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {supplierOptions.map(opt => {
                        const isSelected = pendingSuppliers.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setPendingSuppliers(prev => isSelected ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
                            className={clsx(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                              isSelected ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                            )}
                          >
                            <span className="text-[13px] font-bold truncate pr-4">{opt.label}</span>
                            <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', isSelected ? 'bg-primary border-primary' : 'border-slate-300')}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PIC Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'pic' ? null : 'pic')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">PIC</span>
                      {pendingPics.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingPics.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'pic' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'pic' && (
                    <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {employeeOptions.map(opt => {
                        const isSelected = pendingPics.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setPendingPics(prev => isSelected ? prev.filter(v => v !== opt.value) : [...prev, opt.value])}
                            className={clsx(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                              isSelected ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                            )}
                          >
                            <span className="text-[13px] font-bold truncate pr-4">{opt.label}</span>
                            <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', isSelected ? 'bg-primary border-primary' : 'border-slate-300')}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* HS Code Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'hs' ? null : 'hs')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">HS Code</span>
                      {pendingHsCodes.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingHsCodes.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'hs' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'hs' && (
                    <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {Array.from(new Set(purchasingItems.map(i => i.hs_code).filter(h => h))).map(hs => {
                        const isSelected = pendingHsCodes.includes(hs!);
                        return (
                          <button
                            key={hs}
                            onClick={() => setPendingHsCodes(prev => isSelected ? prev.filter(v => v !== hs) : [...prev, hs!])}
                            className={clsx(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                              isSelected ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                            )}
                          >
                            <span className="text-[13px] font-bold truncate pr-4">{hs}</span>
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
                  setPendingSuppliers([]);
                  setPendingPics([]);
                  setPendingHsCodes([]);
                }}
                className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-[14px] font-bold hover:bg-red-50 transition-all active:scale-95"
              >
                Clear All
              </button>
              <button
                onClick={applyMobileFilter}
                className="w-full py-4 rounded-2xl bg-primary text-white text-[15px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        , document.body)}

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
                Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedItems.length} items` : 'this item'}?
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

export default PurchasingPage;
