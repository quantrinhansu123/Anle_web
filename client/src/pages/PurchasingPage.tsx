import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Search, Plus,
  Edit, Trash2, List, BarChart2,
  RefreshCcw, DollarSign, Package,
  TrendingUp, Users, RotateCcw,
  ChevronRight, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { purchasingService, type PurchasingItem, type CreatePurchasingItemDto } from '../services/purchasingService';
import { shipmentService } from '../services/shipmentService';
import { supplierService } from '../services/supplierService';
import { employeeService } from '../services/employeeService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import AddEditPurchasingDialog from './purchasing/dialogs/AddEditPurchasingDialog';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

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
    renderContent: (item) => <span>#{item.shipment_id.slice(0, 8)}</span>
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
    renderContent: (item) => <span>{item.employees?.full_name || '—'}</span>
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
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [purchasingItems, setPurchasingItems] = useState<PurchasingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

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

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<Partial<PurchasingItem>>(INITIAL_FORM_STATE);
  
  // Options
  const [shipmentOptions, setShipmentOptions] = useState<{value: string, label: string}[]>([]);
  const [fullShipments, setFullShipments] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{value: string, label: string}[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{value: string, label: string}[]>([]);

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
    } catch (err) {
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
      setShipmentOptions(shipments.map(s => ({ value: s.id, label: `#${s.id.slice(0, 8)} - ${s.commodity}` })));
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
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: PurchasingItem) => {
    setFormState(item);
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
      if (isEditMode && formState.id) {
        await purchasingService.updatePurchasingItem(formState.id, formState as any);
      } else {
        await purchasingService.createPurchasingItem(formState as any);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save purchasing item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await purchasingService.deletePurchasingItem(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete item');
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;
    try {
      setLoading(true);
      await Promise.all(selectedItems.map(id => purchasingService.deletePurchasingItem(id)));
      setSelectedItems([]);
      fetchData();
    } catch (err) {
      console.error('Failed to delete selected:', err);
      alert('Failed to delete some items');
      setLoading(false);
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
        <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          {/* TOOLBAR */}
          <div className="p-4 space-y-4">
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
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                  >
                    <Trash2 size={13} />
                    Delete {selectedItems.length > 1 ? 'Items' : 'Item'}
                  </button>
                  <button 
                    onClick={() => setSelectedItems([])}
                    className="px-3 py-1.5 text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Cancel
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
          <div className="flex-1 overflow-auto border-t border-border bg-slate-50/20">
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
                    <tr key={item.id} className={clsx('hover:bg-slate-50/60 transition-colors group', selectedItems.includes(item.id) && 'bg-primary/[0.02]')}>
                      <td className="px-4 py-4 text-center border-r border-border/40">
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
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 transition-all"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
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


      <AddEditPurchasingDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        isEditMode={isEditMode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        shipmentOptions={shipmentOptions}
        supplierOptions={supplierOptions}
        employeeOptions={employeeOptions}
        onSave={handleSave}
      />
    </div>
  );
};

export default PurchasingPage;
