import React, { useState, useEffect, useRef } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus, Filter,
  Edit, Trash2, X, BarChart2, List,
  ChevronRight, Ship, Plane, Truck,
  MapPin, RefreshCcw,
  TrendingUp, Users, CheckCircle2,
  User as UserIcon, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { shipmentService } from '../services/shipmentService';
import { customerService, type Customer } from '../services/customerService';
import { formatDate } from '../lib/utils';
import { supplierService, type Supplier } from '../services/supplierService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import { useAuth } from '../contexts/AuthContext';
import type { Shipment, ShipmentFormState } from './shipments/types';
import ShipmentDialog from './shipments/dialogs/ShipmentDialog';
import { useToastContext } from '../contexts/ToastContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// --- CONFIGURATION ---
const INITIAL_FORM_STATE: ShipmentFormState = {
  customer_id: '',
  supplier_id: '',
  commodity: '',
  hs_code: '',
  quantity: 0,
  packing: '',
  vessel_voyage: '',
  term: '',
  transport_air: false,
  transport_sea: true,
  load_fcl: true,
  load_lcl: false,
  pol: '',
  pod: '',
  etd: '',
  eta: '',
  isNewCustomer: false,
  newCustomer: { company_name: '' },
  isNewSupplier: false,
  newSupplier: { id: '', company_name: '' },
  pic_id: ''
};
const statusConfig: Record<string, { label: string; classes: string }> = {
  'pre_booking': { label: 'Pre-booking', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  'in_transit': { label: 'In Transit', classes: 'bg-blue-50 text-blue-600 border-blue-200' },
  'delivered': { label: 'Delivered', classes: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  'cancelled': { label: 'Cancelled', classes: 'bg-red-50 text-red-600 border-red-200' },
};

const transportConfig: Record<string, { label: string; icon: any; color: string }> = {
  'sea': { label: 'Ocean Freight', icon: Ship, color: 'text-blue-500' },
  'air': { label: 'Air Freight', icon: Plane, color: 'text-indigo-500' },
  'land': { label: 'Land Freight', icon: Truck, color: 'text-orange-500' },
};

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (s: Shipment) => React.ReactNode };
const COLUMN_DEFS: Record<string, ColDef> = {
  id: {
    label: 'Shipment ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 font-mono text-[12px] font-bold text-primary',
    renderContent: (s) => <span className="flex flex-col">
      {s.code ? (
        <span className="text-primary font-bold">{s.code}</span>
      ) : (
        <span className="text-slate-400 opacity-60">#{s.id.slice(0, 8)}</span>
      )}
    </span>
  },
  customer: {
    label: 'Customer',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-64 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => <div className="flex flex-col"><span className="text-[13px] font-bold text-foreground">{s.customers?.company_name || '—'}</span><span className="text-[11px] text-muted-foreground opacity-70">{s.commodity || 'General Cargo'}</span></div>
  },
  supplier: {
    label: 'Supplier / Carrier',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-56 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => <span className="text-[13px] font-medium text-slate-700">{s.suppliers?.company_name || '—'}</span>
  },
  mode: {
    label: 'Mode',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => (
      <div className="flex items-center gap-2">
        {s.transport_sea ? <Ship size={14} className="text-blue-500" /> : s.transport_air ? <Plane size={14} className="text-indigo-500" /> : <Truck size={14} className="text-orange-500" />}
        <span className="text-[11px] font-bold uppercase text-slate-400">{s.load_fcl ? 'FCL' : s.load_lcl ? 'LCL' : '—'}</span>
      </div>
    )
  },
  route: {
    label: 'Route (POL → POD)',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-64 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600"><MapPin size={12} className="text-slate-300" /><span>{s.pol || '—'}</span><span className="text-slate-300">→</span><span>{s.pod || '—'}</span></div>
  },
  dates: {
    label: 'ETD / ETA',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-48 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (s) => (
      <div className="flex items-center gap-3">
        <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">ETD</span><span className="text-[12px] text-slate-600 font-medium tabular-nums">{formatDate(s.etd)}</span></div>
        <div className="flex flex-col border-l border-border pl-3"><span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">ETA</span><span className="text-[12px] text-slate-600 font-medium tabular-nums">{formatDate(s.eta)}</span></div>
      </div>
    )
  },
  status: {
    label: 'Status',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-32',
    tdClass: 'px-4 py-4',
    renderContent: (s) => {
      const isDelivered = s.eta && new Date(s.eta).getTime() < new Date().getTime();
      const statusKey = isDelivered ? 'delivered' : 'in_transit';
      return <span className={clsx('px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap block text-center', statusConfig[statusKey].classes)}>{statusConfig[statusKey].label}</span>;
    }
  }
};
const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Data State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchText, setSearchText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Filters (Matching CandidatesPage logic)
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  // Mobile Filter sheet
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [mobileFilterClosing, setMobileFilterClosing] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>('mode');
  const [pendingModes, setPendingModes] = useState<string[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<string[]>([]);
  const [pendingRoutes, setPendingRoutes] = useState<string[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [formState, setFormState] = useState<ShipmentFormState>(INITIAL_FORM_STATE);
  // Options for Selects
  const [customerOptions, setCustomerOptions] = useState<(Customer & { value: string, label: string })[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<(Supplier & { value: string, label: string })[]>([]);

  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  const setFormField = <K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) => {
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
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getShipments(1, 100);
      setShipments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [customers, suppliers] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers()
      ]);
      setCustomerOptions(customers.map(c => ({ ...c, value: c.id, label: c.company_name })));
      setSupplierOptions(suppliers.map(s => ({ ...s, value: s.id, label: s.company_name })));
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  // --- ACTIONS ---
  const handleOpenAdd = () => {
    setFormState({
      ...INITIAL_FORM_STATE,
      pic: user ? { full_name: user.full_name } : undefined
    });
    setIsEditMode(false);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (shipment: Shipment) => {
    setFormState({
      ...shipment,
      isNewCustomer: false,
      isNewSupplier: false,
      newCustomer: { company_name: '' },
      newSupplier: { id: '', company_name: '' }
    });
    setIsEditMode(true);
    setIsDetailMode(false);
    setIsDialogOpen(true);
  };
  const handleOpenDetail = (shipment: Shipment) => {
    setFormState({
      ...shipment,
      isNewCustomer: false,
      isNewSupplier: false,
      newCustomer: { company_name: '' },
      newSupplier: { id: '', company_name: '' }
    });
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

  const handleConfirmCustomer = async () => {
    try {
      if (!formState.newCustomer?.company_name) {
        error('Company Name is required');
        return;
      }
      setIsSavingCustomer(true);
      let finalCustomerId = formState.customer_id;

      if (formState.isNewCustomer) {
        const newCust = await customerService.createCustomer({
          company_name: formState.newCustomer.company_name,
          code: formState.newCustomer.code,
          email: formState.newCustomer.email,
          phone: formState.newCustomer.phone,
          address: formState.newCustomer.address,
          tax_code: formState.newCustomer.tax_code
        });
        finalCustomerId = newCust.id;
        success('Customer created successfully');
      } else if (formState.isEditingCustomer && formState.customer_id && formState.newCustomer) {
        await customerService.updateCustomer(formState.customer_id, {
          company_name: formState.newCustomer.company_name,
          code: formState.newCustomer.code,
          email: formState.newCustomer.email,
          phone: formState.newCustomer.phone,
          address: formState.newCustomer.address,
          tax_code: formState.newCustomer.tax_code
        });
        success('Customer updated successfully');
      }

      await fetchOptions(); // Refresh lists
      setFormState(prev => ({
        ...prev,
        customer_id: finalCustomerId,
        isNewCustomer: false,
        isEditingCustomer: false,
        newCustomer: { company_name: '' }
      }));
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to save customer info'));
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleConfirmSupplier = async () => {
    try {
      if (!formState.newSupplier?.company_name) {
        error('Company Name is required');
        return;
      }
      if (formState.isNewSupplier && (!formState.newSupplier.id || formState.newSupplier.id.length !== 3)) {
        error('Supplier Code must be exactly 3 characters');
        return;
      }

      setIsSavingSupplier(true);
      let finalSupplierId = formState.supplier_id;

      if (formState.isNewSupplier) {
        const newSupp = await supplierService.createSupplier({
          id: formState.newSupplier.id,
          company_name: formState.newSupplier.company_name,
          email: formState.newSupplier.email,
          phone: formState.newSupplier.phone,
          address: formState.newSupplier.address,
          tax_code: formState.newSupplier.tax_code
        });
        finalSupplierId = newSupp.id;
        success('Supplier created successfully');
      } else if (formState.isEditingSupplier && formState.supplier_id && formState.newSupplier) {
        await supplierService.updateSupplier(formState.supplier_id, {
          company_name: formState.newSupplier.company_name,
          email: formState.newSupplier.email,
          phone: formState.newSupplier.phone,
          address: formState.newSupplier.address,
          tax_code: formState.newSupplier.tax_code
        });
        success('Supplier updated successfully');
      }

      await fetchOptions(); // Refresh lists
      setFormState(prev => ({
        ...prev,
        supplier_id: finalSupplierId,
        isNewSupplier: false,
        isEditingSupplier: false,
        newSupplier: { id: '', company_name: '' }
      }));
    } catch (err: any) {
      console.error('Failed to save supplier:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to save supplier info'));
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleSave = async () => {
    try {
      let finalCustomerId = formState.customer_id;
      let finalSupplierId = formState.supplier_id;

      // Handle Customer (New or Edit Existing)
      if (formState.isNewCustomer && formState.newCustomer?.company_name) {
        const newCust = await customerService.createCustomer({
          company_name: formState.newCustomer.company_name,
          code: formState.newCustomer.code,
          email: formState.newCustomer.email,
          phone: formState.newCustomer.phone,
          address: formState.newCustomer.address,
          tax_code: formState.newCustomer.tax_code
        });
        finalCustomerId = newCust.id;
      } else if (formState.isEditingCustomer && formState.customer_id && formState.newCustomer) {
        await customerService.updateCustomer(formState.customer_id, {
          company_name: formState.newCustomer.company_name,
          code: formState.newCustomer.code,
          email: formState.newCustomer.email,
          phone: formState.newCustomer.phone,
          address: formState.newCustomer.address,
          tax_code: formState.newCustomer.tax_code
        });
      }

      // Handle Supplier (New or Edit Existing)
      if (formState.isNewSupplier && formState.newSupplier?.company_name) {
        if (!formState.newSupplier.id || formState.newSupplier.id.length !== 3) {
          error('Supplier Code must be exactly 3 characters');
          return;
        }
        const newSupp = await supplierService.createSupplier({
          id: formState.newSupplier.id,
          company_name: formState.newSupplier.company_name,
          email: formState.newSupplier.email,
          phone: formState.newSupplier.phone,
          address: formState.newSupplier.address,
          tax_code: formState.newSupplier.tax_code
        });
        finalSupplierId = newSupp.id;
      } else if (formState.isEditingSupplier && formState.supplier_id && formState.newSupplier) {
        await supplierService.updateSupplier(formState.supplier_id, {
          company_name: formState.newSupplier.company_name,
          email: formState.newSupplier.email,
          phone: formState.newSupplier.phone,
          address: formState.newSupplier.address,
          tax_code: formState.newSupplier.tax_code
        });
      }

      if (!finalCustomerId || !finalSupplierId) {
        error('Please select or create a customer and supplier.');
        return;
      }

      const dto = {
        ...formState,
        customer_id: finalCustomerId,
        supplier_id: finalSupplierId,
        pic_id: isEditMode ? formState.pic_id : user?.id,
      };

      if (isEditMode && formState.id) {
        await shipmentService.updateShipment(formState.id, dto);
      } else {
        await shipmentService.createShipment(dto);
      }

      handleCloseDialog();
      fetchData();
      fetchOptions(); // Refresh lists in case new ones were added
      success(isEditMode ? 'Shipment updated successfully' : 'Shipment created successfully');
    } catch (err: any) {
      console.error('Failed to save shipment:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to save shipment. Please try again.'));
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
        await shipmentService.deleteShipment(confirmAction.id);
        success('Shipment deleted successfully');
        if (selectedShipments.includes(confirmAction.id)) {
          setSelectedShipments(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedShipments.map(id => shipmentService.deleteShipment(id)));
        success(`${selectedShipments.length} shipments deleted successfully`);
        setSelectedShipments([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to delete shipment(s)'));
    } finally {
      setIsDeleting(false);
    }
  };



  const filteredShipments = shipments.filter(s => {
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesText =
        s.id.toLowerCase().includes(search) ||
        s.customers?.company_name?.toLowerCase().includes(search) ||
        s.suppliers?.company_name?.toLowerCase().includes(search) ||
        s.commodity?.toLowerCase().includes(search);
      if (!matchesText) return false;
    }

    // Filter logic
    if (selectedModes.length > 0) {
      const isSea = selectedModes.includes('sea') && s.transport_sea;
      const isAir = selectedModes.includes('air') && s.transport_air;
      const isLand = selectedModes.includes('land') && (!s.transport_sea && !s.transport_air);
      if (!isSea && !isAir && !isLand) return false;
    }
    if (selectedCustomers.length > 0 && !selectedCustomers.includes(s.customer_id)) return false;
    if (selectedRoutes.length > 0 && s.pod && !selectedRoutes.includes(s.pod)) return false;

    return true;
  });

  const hasActiveFilters = selectedModes.length > 0 || selectedCustomers.length > 0 || selectedRoutes.length > 0;

  // --- ACTIONS ---
  const toggleSelectAll = () => {
    if (selectedShipments.length === filteredShipments.length) setSelectedShipments([]);
    else setSelectedShipments(filteredShipments.map(s => s.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedShipments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const closeMobileFilter = () => {
    setMobileFilterClosing(true);
    setTimeout(() => {
      setShowMobileFilter(false);
      setMobileFilterClosing(false);
    }, 280);
  };

  const openMobileFilter = () => {
    setPendingModes(selectedModes);
    setPendingCustomers(selectedCustomers);
    setPendingRoutes(selectedRoutes);
    setMobileExpandedSection('mode');
    setShowMobileFilter(true);
  };

  const applyMobileFilter = () => {
    setSelectedModes(pendingModes);
    setSelectedCustomers(pendingCustomers);
    setSelectedRoutes(pendingRoutes);
    closeMobileFilter();
  };


  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      {/* Sidebar Style Tabs (Matching CandidatesPage) */}
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
            <button onClick={() => navigate('/shipments')} className="p-2 rounded-xl border border-border bg-white text-muted-foreground"><ChevronLeft size={18} /></button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input type="text" placeholder="Search shipments..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-9 pr-8 py-2 bg-muted/20 border border-border rounded-xl text-[13px] font-medium" />
            </div>
            <button
              onClick={openMobileFilter}
              className={clsx('p-2 rounded-xl border relative', hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-muted-foreground')}
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {selectedModes.length + selectedCustomers.length + selectedRoutes.length}
                </span>
              )}
            </button>
            <button onClick={handleOpenAdd} className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20"><Plus size={18} /></button>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {loading ? <div className="py-16 text-center animate-pulse text-muted-foreground italic">Loading Shipments...</div> :
              filteredShipments.length === 0 ? <div className="py-16 text-center text-[13px] text-muted-foreground italic">No matching shipments</div> :
                filteredShipments.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleOpenDetail(s)}
                    className="bg-white rounded-2xl border border-border p-4 shadow-sm hover:border-primary/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-mono font-bold text-primary">
                          {s.code || `#${s.id.slice(0, 8)}`}
                        </span>
                        <span className="text-[14px] font-bold text-slate-900 leading-tight">{s.customers?.company_name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.transport_sea ? <Ship size={14} className="text-blue-500" /> : s.transport_air ? <Plane size={14} className="text-indigo-500" /> : <Truck size={14} className="text-orange-500" />}
                        <span className={clsx('px-2 py-0.5 rounded-full text-[9px] font-bold border', (s.eta && new Date(s.eta) < new Date() ? statusConfig.delivered : statusConfig.in_transit).classes)}>
                          {(s.eta && new Date(s.eta) < new Date() ? statusConfig.delivered : statusConfig.in_transit).label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <div className="flex items-center gap-2"><MapPin size={10} /><span>{s.pol} → {s.pod}</span></div>
                      <span>{formatDate(s.etd)}</span>
                    </div>
                  </div>
                ))}
          </div>

          {/* DESKTOP TOOLBAR */}
          <div className="hidden md:block p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => navigate('/shipments')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"><ChevronLeft size={16} />Back</button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input type="text" placeholder="Search shipments..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedShipments.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[12px] font-bold border border-red-200 hover:bg-red-100 transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <Trash2 size={16} />
                      Delete Selected ({selectedShipments.length})
                    </button>
                    <button
                      onClick={() => setSelectedShipments([])}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-xl text-[12px] font-bold border border-border hover:bg-slate-50 transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <X size={16} />
                      Clear
                    </button>
                  </>
                )}
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
                  New Shipment
                </button>
              </div>
            </div>

            {/* Secondary Filters */}
            <div className="hidden md:flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'mode' ? null : 'mode');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'mode' || selectedModes.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Ship size={14} className={clsx(activeDropdown === 'mode' || selectedModes.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Transport Mode
                  {selectedModes.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedModes.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'mode' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'mode'}
                  options={Object.entries(transportConfig).map(([k, v]) => ({
                    id: k,
                    label: v.label,
                    count: shipments.filter(s => k === 'sea' ? s.transport_sea : k === 'air' ? s.transport_air : (!s.transport_sea && !s.transport_air)).length
                  }))}
                  selected={selectedModes}
                  onToggle={(id) => setSelectedModes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'customer' ? null : 'customer');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'customer' || selectedCustomers.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <UserIcon size={14} className={clsx(activeDropdown === 'customer' || selectedCustomers.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Customer
                  {selectedCustomers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedCustomers.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'customer' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'customer'}
                  options={Array.from(new Set(shipments.map(s => s.customer_id))).filter(id => id).map(id => ({
                    id,
                    label: shipments.find(s => s.customer_id === id)?.customers?.company_name || id,
                    count: shipments.filter(s => s.customer_id === id).length
                  }))}
                  selected={selectedCustomers}
                  onToggle={(id) => setSelectedCustomers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown('port' === activeDropdown ? null : 'port');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    'port' === activeDropdown || selectedRoutes.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <MapPin size={14} className={clsx('port' === activeDropdown || selectedRoutes.length > 0 ? "text-primary" : "text-muted-foreground/50")} />
                  Port of Discharge
                  {selectedRoutes.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedRoutes.length}
                    </span>
                  )}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", 'port' === activeDropdown ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'port'}
                  options={Array.from(new Set(shipments.map(s => s.pod))).filter(pod => pod).map(pod => ({
                    id: pod!,
                    label: pod!,
                    count: shipments.filter(s => s.pod === pod).length
                  }))}
                  selected={selectedRoutes}
                  onToggle={(id) => setSelectedRoutes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 border-t border-border">
            <div className="flex-1 overflow-auto bg-slate-50/20">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center"><input type="checkbox" checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0} onChange={toggleSelectAll} className="rounded border-border" /></th>
                    {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                      <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={visibleColumns.length + 2} className="px-4 py-6 bg-slate-50/10 border-b border-border/40"></td></tr>
                  )) : filteredShipments.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length + 2} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No shipments found.</td></tr>
                  ) : filteredShipments.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenDetail(s)}
                      className={clsx('hover:bg-slate-50/60 transition-colors group cursor-pointer', selectedShipments.includes(s.id) && 'bg-primary/[0.02]')}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedShipments.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-border" />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(s)}</td>
                      ))}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetail(s)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(s.id, e)}
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
              <span className="text-[12px] font-medium text-slate-500">Showing <b>1</b> – <b>{filteredShipments.length}</b> of <b>{filteredShipments.length}</b> result(s)</span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Prev</button>
                <button className="px-4 py-1.5 rounded-lg border border-border bg-primary text-white text-[12px] font-bold shadow-sm ring-1 ring-primary/20 transition-all">1</button>
                <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STATS TAB */
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 animate-in fade-in duration-300">
          {/* ── MOBILE STATS TOOLBAR ── */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-border shrink-0 relative">
            <button
              onClick={() => navigate('/shipments')}
              className="p-2 rounded-xl border border-border bg-white text-muted-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-[14px] font-bold text-slate-900 whitespace-nowrap">Statistical Overview</span>
            <button
              onClick={openMobileFilter}
              className="relative p-2 rounded-xl border border-border bg-white text-muted-foreground flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {selectedModes.length + selectedCustomers.length + selectedRoutes.length}
                </span>
              )}
            </button>
          </div>

          {/* ── DESKTOP STATS TOOLBAR ── */}
          <div className="hidden md:block p-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
              <button
                onClick={() => navigate('/shipments')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground text-[12px] font-bold transition-all bg-white shadow-sm shrink-0"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="w-px h-5 bg-border mx-1" />

              <div className="relative">
                <button
                  onClick={() => { setActiveDropdown(activeDropdown === 'mode' ? null : 'mode'); setFilterSearch(''); }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold',
                    activeDropdown === 'mode' || selectedModes.length > 0
                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <Ship size={14} className={clsx(activeDropdown === 'mode' || selectedModes.length > 0 ? 'text-primary' : 'text-muted-foreground/50')} />
                  Transport Mode
                  {selectedModes.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedModes.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'mode' ? '-rotate-90' : 'rotate-90')} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'mode'}
                  options={Object.entries(transportConfig).map(([k, v]) => ({
                    id: k,
                    label: v.label,
                    count: shipments.filter(s => k === 'sea' ? s.transport_sea : k === 'air' ? s.transport_air : (!s.transport_sea && !s.transport_air)).length
                  }))}
                  selected={selectedModes}
                  onToggle={(id) => setSelectedModes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => { setActiveDropdown(activeDropdown === 'customer' ? null : 'customer'); setFilterSearch(''); }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold',
                    activeDropdown === 'customer' || selectedCustomers.length > 0
                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <UserIcon size={14} className={clsx(activeDropdown === 'customer' || selectedCustomers.length > 0 ? 'text-primary' : 'text-muted-foreground/50')} />
                  Customer
                  {selectedCustomers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedCustomers.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'customer' ? '-rotate-90' : 'rotate-90')} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'customer'}
                  options={Array.from(new Set(shipments.map(s => s.customer_id))).filter(id => id).map(id => ({
                    id,
                    label: shipments.find(s => s.customer_id === id)?.customers?.company_name || id,
                    count: shipments.filter(s => s.customer_id === id).length
                  }))}
                  selected={selectedCustomers}
                  onToggle={(id) => setSelectedCustomers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => { setActiveDropdown(activeDropdown === 'port' ? null : 'port'); setFilterSearch(''); }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold',
                    activeDropdown === 'port' || selectedRoutes.length > 0
                      ? 'bg-primary/5 border-primary text-primary shadow-sm'
                      : 'bg-white border-border hover:bg-muted text-muted-foreground',
                  )}
                >
                  <MapPin size={14} className={clsx(activeDropdown === 'port' || selectedRoutes.length > 0 ? 'text-primary' : 'text-muted-foreground/50')} />
                  Port of Discharge
                  {selectedRoutes.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedRoutes.length}</span>
                  )}
                  <ChevronRight size={14} className={clsx('transition-transform ml-1 opacity-40', activeDropdown === 'port' ? '-rotate-90' : 'rotate-90')} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'port'}
                  options={Array.from(new Set(shipments.map(s => s.pod))).filter(pod => pod).map(pod => ({
                    id: pod!,
                    label: pod!,
                    count: shipments.filter(s => s.pod === pod).length
                  }))}
                  selected={selectedRoutes}
                  onToggle={(id) => setSelectedRoutes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => { setSelectedModes([]); setSelectedCustomers([]); setSelectedRoutes([]); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-red-300 text-red-500 text-[12px] font-bold hover:bg-red-50 transition-all"
                >
                  <X size={13} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Scrollable stats body */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 md:gap-4 no-scrollbar">
            {/* Summary KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total Shipments', value: filteredShipments.length, icon: <Ship size={18} />, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'In Transit', value: filteredShipments.filter(s => !s.eta || new Date(s.eta).getTime() >= new Date().getTime()).length, icon: <TrendingUp size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
                { label: 'Delivered', value: filteredShipments.filter(s => s.eta && new Date(s.eta).getTime() < new Date().getTime()).length, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'Sea Freight', value: filteredShipments.filter(s => s.transport_sea).length, icon: <Ship size={18} />, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                { label: 'Air Freight', value: filteredShipments.filter(s => s.transport_air).length, icon: <Plane size={18} />, color: 'text-sky-600', bg: 'bg-sky-500/10' },
              ].map((item, idx) => (
                <div key={item.label} className={clsx('bg-white rounded-2xl border border-border shadow-sm p-4 md:p-5 flex items-center gap-3 md:gap-4', idx === 0 && 'col-span-2 md:col-span-1')}>
                  <div className={clsx('w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0', item.bg, item.color)}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide leading-none mb-1">{item.label}</p>
                    <p className={clsx('text-xl md:text-2xl font-black tabular-nums', item.color)}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* PieChart – Transport Mode */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Ship size={15} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Transport Mode</span>
                </div>
                {(() => {
                  const COLORS = ['#3b82f6', '#6366f1', '#f97316'];
                  const pieData = [
                    { name: 'Sea', value: filteredShipments.filter(s => s.transport_sea).length },
                    { name: 'Air', value: filteredShipments.filter(s => s.transport_air).length },
                    { name: 'Land', value: filteredShipments.filter(s => !s.transport_sea && !s.transport_air).length },
                  ];
                  return (
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <div className="w-full max-w-55 md:w-40 md:max-w-none shrink-0 mx-auto md:mx-0">
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" paddingAngle={3}>
                              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-2.5 w-full md:flex-1">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                            <span className="text-[11px] text-muted-foreground font-medium flex-1 truncate">{d.name}</span>
                            <span className="text-[11px] font-bold text-foreground">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* BarChart – Top Customers */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon size={15} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Top Customers</span>
                </div>
                {(() => {
                  const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];
                  const customerData = Array.from(new Set(filteredShipments.map(s => s.customer_id))).slice(0, 5).map((cid, i) => {
                    const name = filteredShipments.find(s => s.customer_id === cid)?.customers?.company_name || cid;
                    return {
                      name: name.length > 10 ? name.slice(0, 10) + '…' : name,
                      fullName: name,
                      count: filteredShipments.filter(s => s.customer_id === cid).length,
                      fill: BAR_COLORS[i % BAR_COLORS.length],
                    };
                  });
                  return (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={customerData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                          formatter={(v, _, props) => [v, (props.payload as { fullName?: string })?.fullName ?? '']}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {customerData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* BarChart – Top Ports (POD) */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={15} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Top Ports (POD)</span>
                </div>
                {(() => {
                  const BAR_COLORS = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
                  const podData = Array.from(new Set(filteredShipments.filter(s => s.pod).map(s => s.pod!))).slice(0, 5).map((pod, i) => ({
                    name: pod.length > 10 ? pod.slice(0, 10) + '…' : pod,
                    fullName: pod,
                    count: filteredShipments.filter(s => s.pod === pod).length,
                    fill: BAR_COLORS[i % BAR_COLORS.length],
                  }));
                  return (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={podData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                          formatter={(v, _, props) => [v, (props.payload as { fullName?: string })?.fullName ?? '']}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {podData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Detail tables row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pb-8">
              {/* Table – Transport Mode */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
                  <Ship size={14} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Mode Distribution</span>
                </div>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="px-4 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Mode</th>
                      <th className="px-4 py-2 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { label: 'Ocean Freight', count: filteredShipments.filter(s => s.transport_sea).length },
                      { label: 'Air Freight', count: filteredShipments.filter(s => s.transport_air).length },
                      { label: 'Land Freight', count: filteredShipments.filter(s => !s.transport_sea && !s.transport_air).length },
                    ].map((item) => (
                      <tr key={item.label} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700">{item.label}</td>
                        <td className="px-4 py-3 text-right font-black text-primary tabular-nums">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table – Top Customers */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
                  <UserIcon size={14} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Volume by Customer</span>
                </div>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="px-4 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Customer</th>
                      <th className="px-4 py-2 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {Array.from(new Set(filteredShipments.map(s => s.customer_id))).slice(0, 6).map(cid => {
                      const name = filteredShipments.find(s => s.customer_id === cid)?.customers?.company_name || cid;
                      const count = filteredShipments.filter(s => s.customer_id === cid).length;
                      return (
                        <tr key={cid} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-40">{name}</td>
                          <td className="px-4 py-3 text-right font-black text-primary tabular-nums">{count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table – Top PODs */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Volume by POD</span>
                </div>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="px-4 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Port</th>
                      <th className="px-4 py-2 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {Array.from(new Set(filteredShipments.filter(s => s.pod).map(s => s.pod!))).slice(0, 6).map(pod => {
                      const count = filteredShipments.filter(s => s.pod === pod).length;
                      return (
                        <tr key={pod} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-40">{pod}</td>
                          <td className="px-4 py-3 text-right font-black text-primary tabular-nums">{count}</td>
                        </tr>
                      );
                    })}
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
              <button onClick={closeMobileFilter} className="p-1.5 text-muted-foreground hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border/60">
                {/* Transport Mode Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'mode' ? null : 'mode')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Ship size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">Transport Mode</span>
                      {pendingModes.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingModes.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'mode' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'mode' && (
                    <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {['sea', 'air', 'land'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => setPendingModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])}
                          className={clsx(
                            'px-4 py-2 rounded-xl border text-[13px] font-bold transition-all flex items-center gap-2',
                            pendingModes.includes(mode) ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-slate-50 text-slate-600 border-slate-200'
                          )}
                        >
                          {mode === 'sea' ? <Ship size={14} /> : mode === 'air' ? <Plane size={14} /> : <Truck size={14} />}
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'customer' ? null : 'customer')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">Customer</span>
                      {pendingCustomers.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingCustomers.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'customer' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'customer' && (
                    <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {Array.from(new Set(shipments.map(s => s.customer_id))).filter(id => id).map(id => {
                        const name = shipments.find(s => s.customer_id === id)?.customers?.company_name || id;
                        const isSelected = pendingCustomers.includes(id);
                        return (
                          <button
                            key={id}
                            onClick={() => setPendingCustomers(prev => isSelected ? prev.filter(v => v !== id) : [...prev, id])}
                            className={clsx(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                              isSelected ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                            )}
                          >
                            <span className="text-[13px] font-bold truncate pr-4">{name}</span>
                            <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', isSelected ? 'bg-primary border-primary' : 'border-slate-300')}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Port of Discharge Section */}
                <div className="px-5 py-4">
                  <button
                    onClick={() => setMobileExpandedSection(mobileExpandedSection === 'port' ? null : 'port')}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-[15px] font-bold text-slate-800">Port of Discharge</span>
                      {pendingRoutes.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{pendingRoutes.length}</span>}
                    </div>
                    <ChevronRight size={18} className={clsx('text-slate-400 transition-transform', mobileExpandedSection === 'port' && 'rotate-90')} />
                  </button>
                  {mobileExpandedSection === 'port' && (
                    <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {Array.from(new Set(shipments.map(s => s.pod))).filter(pod => pod).map(pod => {
                        const isSelected = pendingRoutes.includes(pod!);
                        return (
                          <button
                            key={pod}
                            onClick={() => setPendingRoutes(prev => isSelected ? prev.filter(v => v !== pod) : [...prev, pod!])}
                            className={clsx(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                              isSelected ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                            )}
                          >
                            <span className="text-[13px] font-bold truncate pr-4">{pod}</span>
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
                  setPendingModes([]);
                  setPendingCustomers([]);
                  setPendingRoutes([]);
                }}
                className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-[14px] font-bold hover:bg-red-50 transition-all"
              >
                Clear All
              </button>
              <button
                onClick={applyMobileFilter}
                className="w-full py-4 rounded-2xl bg-primary text-white text-[15px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        , document.body)}
      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isProcessing={isDeleting}
        message={
          <>
            Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedShipments.length} shipments` : 'this shipment'}?
            All associated data will be permanently removed.
          </>
        }
      />

      {/* SHIPMENT DIALOG */}
      <ShipmentDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        isDetailMode={isDetailMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        customerOptions={customerOptions}
        supplierOptions={supplierOptions}
        onSave={handleSave}
        onEdit={() => {
          setIsEditMode(true);
          setIsDetailMode(false);
        }}
        onConfirmCustomer={handleConfirmCustomer}
        onConfirmSupplier={handleConfirmSupplier}
        isSavingCustomer={isSavingCustomer}
        isSavingSupplier={isSavingSupplier}
      />
    </div>
  );
};

export default ShipmentsPage;
