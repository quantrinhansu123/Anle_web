import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus, Filter,
  Edit, Trash2, X, BarChart2, List,
  ChevronRight, Ship, Plane, Truck,
  MapPin, RefreshCcw,
  TrendingUp, Users, CheckCircle2, Clock,
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
import { toast } from '../lib/toast';
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
    renderContent: (s) => <span>#{s.id.slice(0, 8)}</span>
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
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);

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
    } catch (err) {
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

  const handleSave = async () => {
    try {
      let finalCustomerId = formState.customer_id;
      let finalSupplierId = formState.supplier_id;

      // Handle New Customer
      if (formState.isNewCustomer && formState.newCustomer?.company_name) {
        const newCust = await customerService.createCustomer({
          company_name: formState.newCustomer.company_name,
          email: formState.newCustomer.email,
          phone: formState.newCustomer.phone,
          address: formState.newCustomer.address,
          tax_code: formState.newCustomer.tax_code
        });
        finalCustomerId = newCust.id;
      }

      // Handle New Supplier
      if (formState.isNewSupplier && formState.newSupplier?.company_name) {
        if (!formState.newSupplier.id || formState.newSupplier.id.length !== 3) {
          toast.error('Supplier Code must be exactly 3 characters');
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
      }

      if (!finalCustomerId || !finalSupplierId) {
        toast.error('Please select or create a customer and supplier.');
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
      toast.success(isEditMode ? 'Shipment updated successfully' : 'Shipment created successfully');
    } catch (err) {
      console.error('Failed to save shipment:', err);
      toast.error('Failed to save shipment. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
      return;
    }

    try {
      await shipmentService.deleteShipment(id);
      toast.success('Shipment deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Failed to delete shipment:', err);
      toast.error('Failed to delete shipment. Please try again.');
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

    return true;
  });

  const hasActiveFilters = selectedModes.length > 0 || selectedCustomers.length > 0;

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
    setTimeout(() => { setShowMobileFilter(false); setMobileFilterClosing(false); }, 280);
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
            <button onClick={() => setShowMobileFilter(true)} className={clsx('p-2 rounded-xl border', hasActiveFilters ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white')}><Filter size={18} /></button>
            <button className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20"><Plus size={18} /></button>
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
                        <span className="text-[11px] font-mono font-bold text-primary">#{s.id.slice(0, 8)}</span>
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
                            onClick={() => handleDelete(s.id)}
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
        <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-1 no-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Top Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Shipments', val: shipments.length, icon: Ship, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Active Transit', val: shipments.filter(s => !s.eta || new Date(s.eta).getTime() >= new Date().getTime()).length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
              { label: 'Delivered', val: shipments.filter(s => s.eta && new Date(s.eta).getTime() < new Date().getTime()).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'Delayed / Warning', val: 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100/50' },
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
            {/* Row 1: charts */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-5 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4"><Filter size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">By Transport Mode</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Sea', val: shipments.filter(s => s.transport_sea).length },
                        { name: 'Air', val: shipments.filter(s => s.transport_air).length },
                        { name: 'Land', val: shipments.filter(s => !s.transport_sea && !s.transport_air).length }
                      ]}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="val"
                    >
                      <Cell fill="#3b82f6" stroke="none" /><Cell fill="#6366f1" stroke="none" /><Cell fill="#f97316" stroke="none" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-5 h-[280px] flex flex-col">
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className="text-primary" /><span className="text-[12px] font-bold text-primary uppercase tracking-wider">Shipment Volume Trend</span></div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Jan', v: 4 }, { name: 'Feb', v: 8 }, { name: 'Mar', v: 6 }, { name: 'Apr', v: 12 }, { name: 'May', v: 9 }]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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

          {/* Row 2: Detail Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-slate-50 flex items-center justify-between text-[11px] font-bold text-primary uppercase tracking-wider"><span>Volume by Customer</span><Users size={14} /></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] text-muted-foreground border-b border-border/60">
                    <tr><th className="px-5 py-2 font-bold uppercase w-2/3">Customer</th><th className="px-5 py-2 font-bold uppercase text-right">Count</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {Array.from(new Set(shipments.map(s => s.customer_id))).slice(0, 5).map(cid => {
                      const customerName = shipments.find(s => s.customer_id === cid)?.customers?.company_name || 'Unknown';
                      const count = shipments.filter(s => s.customer_id === cid).length;
                      return (
                        <tr key={cid} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3"><span className="text-[13px] font-bold text-slate-700">{customerName}</span></td>
                          <td className="px-5 py-3 text-right"><span className="text-[13px] font-black text-primary tabular-nums">{count}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-slate-50 flex items-center justify-between text-[11px] font-bold text-primary uppercase tracking-wider"><span>Volume by Port (POD)</span><MapPin size={14} /></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] text-muted-foreground border-b border-border/60">
                    <tr><th className="px-5 py-2 font-bold uppercase w-2/3">Port of Discharge</th><th className="px-5 py-2 font-bold uppercase text-right">Count</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {Array.from(new Set(shipments.map(s => s.pod || 'Unknown'))).slice(0, 5).map(pod => {
                      const count = shipments.filter(s => s.pod === pod).length;
                      return (
                        <tr key={pod} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3"><span className="text-[13px] font-bold text-slate-700">{pod}</span></td>
                          <td className="px-5 py-3 text-right"><span className="text-[13px] font-black text-primary tabular-nums">{count}</span></td>
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
          <div className={clsx('absolute inset-0 bg-black/40 transition-opacity', mobileFilterClosing ? 'opacity-0' : 'opacity-100')} onClick={closeMobileFilter} />
          <div className={clsx('relative bg-white rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl', mobileFilterClosing ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom')}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="text-[16px] font-bold">Filters</span>
              <button onClick={closeMobileFilter} className="p-1.5 text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Simplified filter view for now */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3">Transport Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {['sea', 'air', 'land'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSelectedModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])}
                      className={clsx('px-3 py-2 rounded-xl border text-[13px] font-bold transition-all', selectedModes.includes(mode) ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-600 border-slate-200')}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-white flex flex-col gap-2">
              <button onClick={() => { setSelectedModes([]); setSelectedCustomers([]); closeMobileFilter(); }} className="w-full py-3 rounded-2xl border border-red-300 text-red-500 text-[14px] font-bold">Clear All</button>
              <button onClick={closeMobileFilter} className="w-full py-4 rounded-2xl bg-primary text-white text-[15px] font-bold shadow-lg shadow-primary/20">Apply Filters</button>
            </div>
          </div>
        </div>
        , document.body)}
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
      />
    </div>
  );
};

export default ShipmentsPage;
