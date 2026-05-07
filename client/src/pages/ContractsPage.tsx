import React, { useState, useRef, useEffect } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ChevronLeft, Search, Plus,
  Edit, Trash2, List,
  ChevronRight, RefreshCcw,
  BarChart2, FileText, User as UserIcon, Truck, ShoppingCart, ExternalLink, X, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { contractService } from '../services/contractService';
import { customerService, type Customer } from '../services/customerService';
import { supplierService, type Supplier } from '../services/supplierService';
import { employeeService } from '../services/employeeService';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { ColumnSettings } from '../components/ui/ColumnSettings';
import { useAuth } from '../contexts/AuthContext';
import type { Contract, CreateContractDto } from './contracts/types';
import ContractDialog from './contracts/dialogs/ContractDialog';
import { useToastContext } from '../contexts/ToastContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- CONFIGURATION ---
const INITIAL_FORM_STATE: Partial<Contract> = {
  customer_id: undefined,
  supplier_id: undefined,
  pic_id: '',
  no_contract: '',
  payment_term: '',
  type_logistic: false,
  type_trading: false,
  file_url: ''
};

type ColDef = { label: string; thClass: string; tdClass: string; renderContent: (c: Contract) => React.ReactNode };
const COLUMN_DEFS: Record<string, ColDef> = {
  id: {
    label: 'ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-24 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-bold text-primary',
    renderContent: (c) => <span>#{c.id.slice(0, 8)}</span>
  },
  name: {
    label: 'Name (Customer/Supplier)',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-64 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (c) => (
      <div className="flex flex-col">
        <span className="text-[13px] font-bold text-foreground">
          {c.customers?.company_name || c.suppliers?.company_name || '—'}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider opacity-60">
          {c.customer_id ? 'Customer' : (c.supplier_id ? 'Supplier' : '—')}
        </span>
      </div>
    )
  },
  pic: {
    label: 'PIC',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-48 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40',
    renderContent: (c) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
          {c.employees?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
        </div>
        <span className="text-[13px] font-medium text-slate-700">{c.employees?.full_name || '—'}</span>
      </div>
    )
  },
  no_contract: {
    label: 'No Contract',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-48 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 font-medium text-[13px]',
    renderContent: (c) => <span>{c.no_contract || '—'}</span>
  },
  payment_term: {
    label: 'Payment Term',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40 border-r border-border/40',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[13px] text-muted-foreground',
    renderContent: (c) => <span>{c.type_trading ? (c.payment_term || '—') : '—'}</span>
  },
  kind: {
    label: 'Kind of Contract',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-tight w-40',
    tdClass: 'px-4 py-4',
    renderContent: (c) => (
      <div className="flex items-center gap-1.5">
        {c.type_logistic && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase">
            <Truck size={10} /> Logistic
          </span>
        )}
        {c.type_trading && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold uppercase">
            <ShoppingCart size={10} /> Trading
          </span>
        )}
        {!c.type_logistic && !c.type_trading && <span className="text-muted-foreground text-[12px]">None</span>}
      </div>
    )
  }
};

const DEFAULT_COL_ORDER = Object.keys(COLUMN_DEFS);

function companyLogoSrc(): string {
  if (import.meta.env.DEV) return '/appsheet-brand-logo';
  return 'https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Fe6a56fae.%E1%BA%A2nh.064359.png';
}

async function downloadPdfFromElement(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());
    },
  });
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;
  while (heightLeft > 0) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }
  pdf.save(filename);
}

const CONTRACT_PDF_CSS = `
.ct-root{ box-sizing:border-box; width: 800px; max-width:100%; margin:0 auto; background:#fff; color:#0f172a; padding:26px 36px 34px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.ct-root *, .ct-root *::before, .ct-root *::after{ box-sizing:border-box; }
.ct-header{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:12px; }
.ct-logo{ width:190px; flex-shrink:0; padding-top:2px; }
.ct-logo img{ width:100%; height:auto; display:block; object-fit:contain; }
.ct-co{ text-align:right; font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:0.18em; line-height:1.55; }
.ct-co .ct-co-name{ color:#0f172a; font-weight:800; }
.ct-band{ display:flex; align-items:center; justify-content:space-between; gap:12px; background:#0ea5e9; color:#fff; padding:10px 14px; border-radius:10px; margin-bottom:14px; }
.ct-title{ font-weight:900; text-transform:uppercase; letter-spacing:0.06em; font-size:13px; }
.ct-meta{ font-weight:800; font-size:11px; opacity:0.95; text-align:right; }
.ct-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px; }
.ct-box{ border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; }
.ct-label{ font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.06em; color:#0284c7; margin-bottom:4px; }
.ct-val{ font-size:13px; font-weight:700; color:#0f172a; }
.ct-sub{ font-size:11px; font-weight:700; color:#475569; }
.ct-sign{ display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:16px; }
.ct-sigbox{ border:1px dashed #cbd5e1; border-radius:12px; padding:12px; min-height:92px; }
.ct-sigtitle{ font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin-bottom:8px; }
.ct-muted{ color:#64748b; font-weight:700; font-size:11px; }
@media print{ @page{ margin:10mm; size:A4;} html, body{ margin:0 !important; padding:0 !important;} .ct-root{ box-shadow:none; width:100%; padding:0; } }
`;

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'single' | 'bulk'; id?: string }>({ type: 'single' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Data State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchText, setSearchText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Filters
  const [selectedPICs, setSelectedPICs] = useState<string[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit' | 'detail'>('add');
  const [formState, setFormState] = useState<Partial<Contract>>(INITIAL_FORM_STATE);

  // Options for Selects
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entityOptions, setEntityOptions] = useState<{ value: string, label: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string, label: string }[]>([]);

  // Column Settings State
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COL_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COL_ORDER);

  const contractPdfRef = useRef<HTMLDivElement | null>(null);
  const [contractPdfDoc, setContractPdfDoc] = useState<{
    contractNo: string;
    entityName: string;
    entityType: string;
    kind: string;
    paymentTerm: string;
    picName: string;
    date: string;
  } | null>(null);

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
      const data = await contractService.getContracts(1, 100);
      setContracts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [customers, suppliers, employees] = await Promise.all([
        customerService.getCustomers(),
        supplierService.getSuppliers(),
        employeeService.getEmployees()
      ]);

      setCustomers(customers);
      setSuppliers(suppliers);

      const combined = [
        ...customers.map(c => ({ value: `C:${c.id}`, label: `(Customer) ${c.company_name}` })),
        ...suppliers.map(s => ({ value: `S:${s.id}`, label: `(Supplier) ${s.company_name}` }))
      ];

      setEntityOptions(combined);
      setEmployeeOptions(employees.map(e => ({ value: e.id, label: e.full_name })));
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const setFormField = (key: keyof CreateContractDto, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenAdd = () => {
    setFormState(INITIAL_FORM_STATE);
    setMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (contract: Contract) => {
    setFormState({ ...contract });
    setMode('edit');
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (contract: Contract) => {
    setFormState({ ...contract });
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

  const handleExportContractPdf = async (c: Contract) => {
    const entityName = c.customers?.company_name || c.suppliers?.company_name || '—';
    const entityType = c.customer_id ? 'Customer' : (c.supplier_id ? 'Supplier' : '—');
    const kind = [c.type_logistic ? 'Logistic' : null, c.type_trading ? 'Trading' : null].filter(Boolean).join(' / ') || '—';
    const contractNo = c.no_contract || `#${c.id.slice(0, 8)}`;
    const paymentTerm = c.type_trading ? (c.payment_term || '—') : '—';
    const picName = c.employees?.full_name || '—';
    const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

    setContractPdfDoc({ contractNo, entityName, entityType, kind, paymentTerm, picName, date });
    await new Promise((r) => setTimeout(r, 50));
    if (!contractPdfRef.current) return;

    const safe = String(contractNo).replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60);
    await downloadPdfFromElement(contractPdfRef.current, `Contract_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`);
    success('Contract PDF exported');
  };

  const handleSave = async () => {
    try {
      if (!formState.no_contract) {
        error('Contract number is required');
        return;
      }
      if (!formState.customer_id && !formState.supplier_id) {
        error('Please select a customer or supplier');
        return;
      }

      const dto = {
        ...formState,
        pic_id: formState.pic_id || user?.id,
      };

      if (mode === 'edit' && formState.id) {
        const updated = await contractService.updateContract(formState.id, dto as any);
        setFormState({ ...updated });
        setMode('detail');
      } else {
        await contractService.createContract(dto as any);
        handleCloseDialog();
        success('Contract created successfully');
      }

      fetchData();
    } catch (err: any) {
      console.error('Failed to save contract:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to save contract'));
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
        await contractService.deleteContract(confirmAction.id);
        success('Contract deleted successfully');
        if (selectedContracts.includes(confirmAction.id)) {
          setSelectedContracts(prev => prev.filter(i => i !== confirmAction.id));
        }
      } else if (confirmAction.type === 'bulk') {
        await Promise.all(selectedContracts.map(id => contractService.deleteContract(id)));
        success(`${selectedContracts.length} contracts deleted successfully`);
        setSelectedContracts([]);
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      error(err instanceof Error ? err.message : (err?.message || 'Failed to delete contract(s)'));
    } finally {
      setIsDeleting(false);
    }
  };

  // --- SELECTION ---
  const toggleSelect = (id: string) => {
    setSelectedContracts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedContracts.length === filteredContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(filteredContracts.map(c => c.id));
    }
  };

  const filteredContracts = contracts.filter(c => {
    const name = c.customers?.company_name || c.suppliers?.company_name || '';
    if (searchText) {
      const search = searchText.toLowerCase();
      const matches =
        name.toLowerCase().includes(search) ||
        c.no_contract?.toLowerCase().includes(search) ||
        c.employees?.full_name?.toLowerCase().includes(search);
      if (!matches) return false;
    }

    if (selectedPICs.length > 0 && c.pic_id && !selectedPICs.includes(c.pic_id)) return false;

    if (selectedKinds.length > 0) {
      const isLogistic = selectedKinds.includes('logistic') && c.type_logistic;
      const isTrading = selectedKinds.includes('trading') && c.type_trading;
      if (!isLogistic && !isTrading) return false;
    }

    return true;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
      {/* Hidden PDF template */}
      <div className="fixed left-[-99999px] top-0 w-[900px]">
        {contractPdfDoc ? (
          <div ref={contractPdfRef} className="ct-root">
            <style dangerouslySetInnerHTML={{ __html: CONTRACT_PDF_CSS }} />
            <header className="ct-header">
              <div className="ct-logo">
                <img src={companyLogoSrc()} alt="ANLE-SCM Logo" />
              </div>
              <div className="ct-co">
                <div className="ct-co-name">COMPANY LTD ANLE-SCM</div>
                <div>Hotline: 0519055056</div>
                <div>Email: MGM@ANLE-SCM.COM</div>
                <div>Website: ANLE-SCM.COM</div>
              </div>
            </header>

            <div className="ct-band">
              <div className="ct-title">Contract</div>
              <div className="ct-meta">
                Date: {contractPdfDoc.date}
                <br />
                No: {contractPdfDoc.contractNo}
              </div>
            </div>

            <div className="ct-grid">
              <div className="ct-box">
                <div className="ct-label">Entity</div>
                <div className="ct-val">{contractPdfDoc.entityName}</div>
                <div className="ct-sub">{contractPdfDoc.entityType}</div>
              </div>
              <div className="ct-box">
                <div className="ct-label">PIC</div>
                <div className="ct-val">{contractPdfDoc.picName}</div>
                <div className="ct-sub">Kind: {contractPdfDoc.kind}</div>
              </div>
              <div className="ct-box">
                <div className="ct-label">Payment term</div>
                <div className="ct-val">{contractPdfDoc.paymentTerm}</div>
                <div className="ct-sub">Applies to Trading contracts</div>
              </div>
              <div className="ct-box">
                <div className="ct-label">Notes</div>
                <div className="ct-val">—</div>
                <div className="ct-sub">Generated from Contracts Directory</div>
              </div>
            </div>

            <div className="ct-sign">
              <div className="ct-sigbox">
                <div className="ct-sigtitle">Company representative</div>
                <div className="ct-muted">Full name, signature, stamp</div>
              </div>
              <div className="ct-sigbox">
                <div className="ct-sigtitle">Customer / Supplier</div>
                <div className="ct-muted">Full name, signature</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
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
          Contract List
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
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-[12px] font-bold transition-all bg-white shadow-sm shrink-0">
                  <ChevronLeft size={16} />Back
                </button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    placeholder="Search contracts..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-8 py-1.5 bg-muted/20 border border-border rounded-xl text-[13px] font-medium"
                  />
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

                {selectedContracts.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <button
                      onClick={handleBulkDeleteClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                    >
                      <Trash2 size={13} />
                      Delete ({selectedContracts.length})
                    </button>
                    <button
                      onClick={() => setSelectedContracts([])}
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
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl text-[13px] font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <Plus size={16} />
                  New Contract
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2" ref={dropdownRef}>
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'pic' ? null : 'pic');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'pic' || selectedPICs.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <UserIcon size={14} />
                  Person In Charge
                  {selectedPICs.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedPICs.length}</span>}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'pic' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'pic'}
                  options={Array.from(new Set(contracts.map(c => c.pic_id))).filter(id => id).map(id => ({
                    id: id!,
                    label: contracts.find(c => c.pic_id === id)?.employees?.full_name || id!,
                    count: contracts.filter(c => c.pic_id === id).length
                  }))}
                  selected={selectedPICs}
                  onToggle={(id) => setSelectedPICs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setActiveDropdown(activeDropdown === 'kind' ? null : 'kind');
                    setFilterSearch('');
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[12px] font-bold shadow-sm",
                    activeDropdown === 'kind' || selectedKinds.length > 0
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <FileText size={14} />
                  Kind of Contract
                  {selectedKinds.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{selectedKinds.length}</span>}
                  <ChevronRight size={14} className={clsx("transition-transform ml-1 opacity-40", activeDropdown === 'kind' ? "-rotate-90" : "rotate-90")} />
                </button>
                <FilterDropdown
                  isOpen={activeDropdown === 'kind'}
                  options={[
                    { id: 'logistic', label: 'Logistic', count: contracts.filter(c => c.type_logistic).length },
                    { id: 'trading', label: 'Trading', count: contracts.filter(c => c.type_trading).length },
                  ]}
                  selected={selectedKinds}
                  onToggle={(id) => setSelectedKinds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  searchValue={filterSearch}
                  onSearchChange={setFilterSearch}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto border-t border-border">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-4 py-3 border-r border-b border-border/40 w-10 text-center"><input type="checkbox" checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0} onChange={toggleSelectAll} className="rounded border-border" /></th>
                  {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                    <th key={key} className={COLUMN_DEFS[key].thClass}>{COLUMN_DEFS[key].label}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-tight border-b border-border/40 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={10} className="px-4 py-6 bg-slate-50/10 border-b border-border/40"></td></tr>
                  ))
                ) : filteredContracts.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">No contracts found.</td></tr>
                ) : (
                  filteredContracts.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenDetail(c)}
                      className={clsx(
                        'hover:bg-slate-50/60 transition-colors group cursor-pointer',
                        selectedContracts.includes(c.id) && 'bg-primary/[0.02]'
                      )}
                    >
                      <td className="px-4 py-4 text-center border-r border-border/40" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedContracts.includes(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-border" />
                      </td>
                      {columnOrder.filter(id => visibleColumns.includes(id)).map(key => (
                        <td key={key} className={COLUMN_DEFS[key].tdClass}>{COLUMN_DEFS[key].renderContent(c)}</td>
                      ))}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                          {c.file_url && (
                            <a
                              href={c.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                              title="View Contract File"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleExportContractPdf(c);
                            }}
                            className="p-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                            title="Export PDF"
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(c);
                            }}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex items-center justify-between shrink-0">
            <span className="text-[12px] font-medium text-slate-500">Showing <b>1</b> – <b>{filteredContracts.length}</b> of <b>{filteredContracts.length}</b> result(s)</span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Prev</button>
              <button className="px-4 py-1.5 rounded-lg border border-border bg-primary text-white text-[12px] font-bold shadow-sm ring-1 ring-primary/20 transition-all">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-border bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      ) : (
        /* Stats Placeholder */
        <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm flex items-center justify-center">
          <div className="text-center space-y-2">
            <BarChart2 size={48} className="mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">Statistics view is coming soon</p>
          </div>
        </div>
      )}

      {/* CONTRACT DIALOG */}
      <ContractDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        mode={mode}
        onClose={handleCloseDialog}
        formState={formState}
        setFormField={setFormField}
        entityOptions={entityOptions}
        employeeOptions={employeeOptions}
        customers={customers}
        suppliers={suppliers}
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
            Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedContracts.length} contracts` : 'this contract'}?
            All associated data will be permanently removed.
          </>
        }
      />
    </div>
  );
};

export default ContractsPage;
