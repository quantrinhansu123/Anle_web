import React, { useState, useEffect, useRef } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, Search, Plus,
  Edit, Trash2, List, BarChart2,
  RefreshCcw, DollarSign, Package,
  TrendingUp, Users, RotateCcw,
  ChevronRight, Truck, X,
  CheckCircle2, Filter
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { purchasingService, type PurchasingItem, type CreatePurchasingItemDto } from '../services/purchasingService';
import { shipmentService } from '../services/shipmentService';
import { supplierService } from '../services/supplierService';
import { employeeService } from '../services/employeeService';
import { exchangeRateService, type ExchangeRate } from '../services/exchangeRateService';
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
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] font-bold text-primary',
    renderContent: (item) => <span>{item.supplier_id}</span>
  },
  shipment_id: {
    label: 'Shipment ID',
    thClass: 'px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-r border-border/40 w-32',
    tdClass: 'px-4 py-4 border-r border-border/40 text-[12px] text-slate-500',
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

async function downloadMultiPagePdf(elements: HTMLElement[], filename: string): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
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
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (i > 0) pdf.addPage();
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
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
    }
  }
  pdf.save(filename);
}

const PURCHASE_ORDER_CSS = `
.po-root { box-sizing: border-box; width: 794px; background: #ffffff; color: #1a1a1a; font-family: 'Times New Roman', Times, serif; font-size: 12px; }
.po-root *, .po-root *::before, .po-root *::after { box-sizing: border-box; }
.po-page { box-sizing: border-box; width: 794px; padding: 30px 44px 40px; background: #ffffff; }
.po-page + .po-page { margin-top: 24px; }
.po-header { display: flex; align-items: center; gap: 18px; padding-bottom: 12px; border-bottom: 1.6px solid #c92a2a; margin-bottom: 18px; }
.po-logo { width: 92px; flex-shrink: 0; }
.po-logo img { width: 100%; height: auto; display: block; object-fit: contain; }
.po-co-block { flex: 1; }
.po-co-name { font-weight: 700; color: #c92a2a; font-size: 14px; margin-bottom: 4px; letter-spacing: 0.01em; }
.po-co-info { font-size: 11px; line-height: 1.6; color: #1a1a1a; }
.po-title { text-align: center; font-size: 18px; font-weight: 700; color: #c92a2a; margin: 14px 0 6px; letter-spacing: 0.04em; }
.po-num { text-align: center; font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 14px; }
.po-date { text-align: right; font-size: 11px; color: #1a1a1a; margin-bottom: 8px; }
.po-parties { display: grid; grid-template-columns: 1fr 1fr; border: 1.5px solid #c92a2a; }
.po-party { padding: 10px 12px; font-size: 11px; line-height: 1.6; }
.po-party + .po-party { border-left: 1.5px solid #c92a2a; }
.po-party .row { margin: 0; }
.po-party .row .lbl { color: #c92a2a; font-style: italic; font-weight: 600; }
.po-currency { color: #c92a2a; font-style: italic; font-size: 11px; padding: 10px 0 4px; font-weight: 600; }
.po-section-title { color: #c92a2a; font-weight: 800; font-size: 12px; letter-spacing: 0.04em; padding-bottom: 4px; border-bottom: 1.5px solid #c92a2a; margin: 4px 0 0; }
.po-table { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 11px; }
.po-table th { padding: 8px 8px; font-style: italic; color: #1a1a1a; font-weight: 400; text-align: center; vertical-align: bottom; }
.po-table thead tr { border-bottom: 1.5px solid #c92a2a; }
.po-table td { padding: 12px 8px; vertical-align: top; border-right: 1.5px solid #c92a2a; }
.po-table td:last-child { border-right: none; }
.po-table .num { text-align: center; font-variant-numeric: tabular-nums; }
.po-table .desc { padding-left: 0; }
.po-total { text-align: right; padding: 18px 8px 0; font-weight: 700; font-size: 12px; }
.po-foot-line { border-top: 1.5px solid #c92a2a; margin-top: 22px; }

.po-spec-grid { display: grid; grid-template-columns: 1fr 1fr; }
.po-spec-cell { padding: 10px 12px; font-size: 11px; line-height: 1.85; }
.po-spec-cell + .po-spec-cell { border-left: 1.5px solid #c92a2a; }
.po-spec-cell .row { margin: 0; }
.po-confirm-grid { display: grid; grid-template-columns: 1fr 1fr; margin-top: 8px; }
.po-confirm-cell { padding: 12px 14px; font-size: 11px; line-height: 1.65; min-height: 180px; }
.po-confirm-cell + .po-confirm-cell { border-left: 1.5px solid #c92a2a; }
.po-confirm-head { text-align: center; font-style: italic; font-size: 11px; padding-bottom: 14px; color: #1a1a1a; }
.po-confirm-cell .name { font-weight: 700; margin-bottom: 4px; }

@media print {
  @page { margin: 10mm; size: A4; }
  html, body { margin: 0 !important; padding: 0 !important; }
  .po-root { width: 100%; }
  .po-page + .po-page { page-break-before: always; margin-top: 0; }
}
`;

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
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  const poPage1Ref = useRef<HTMLDivElement | null>(null);
  const poPage2Ref = useRef<HTMLDivElement | null>(null);
  const [purchaseOrderDoc, setPurchaseOrderDoc] = useState<{
    poNumber: string;
    poDateLong: string;
    currency: string;
    buyer: { name: string; address: string; tel: string; website: string; email: string };
    seller: { name: string; address: string; tel: string; email: string };
    rows: {
      description: string;
      price: number;
      netWeightTons: number | null;
      grossWeightTons: number | null;
      units: string;
      lineTotal: number;
    }[];
    total: number;
    specLeft: string[];
    specRight: { label: string; value: string }[];
    confirmRight: string;
  } | null>(null);

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
      const [shipments, suppliers, employees, rates] = await Promise.all([
        shipmentService.getShipments(1, 1000),
        supplierService.getSuppliers(),
        employeeService.getEmployees(),
        exchangeRateService.getAll()
      ]);
      setFullShipments(shipments as any[]);
      setShipmentOptions((shipments as any[]).map(s => ({ value: s.id, label: `${s.code || '#' + s.id.slice(0, 8)} - ${s.commodity}` })));
      setSupplierOptions((suppliers as any[]).map(s => ({ value: s.id, label: s.company_name })));
      setEmployeeOptions((employees as any[]).map(e => ({ value: e.id, label: e.full_name })));
      setExchangeRates(rates as ExchangeRate[]);
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
    fetchOptions();
    setFormState({ ...INITIAL_FORM_STATE, created_by_id: user?.id });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: PurchasingItem) => {
    fetchOptions();
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

  const exportPurchaseOrderPdfForItems = async (items: PurchasingItem[]) => {
    if (!items.length) return;
    const supplierIds = Array.from(new Set(items.map((s) => s.supplier_id).filter(Boolean)));
    if (supplierIds.length !== 1) {
      toastError('Please select items from 1 supplier only to export a Purchase Order');
      return;
    }

    const supplierId = supplierIds[0]!;
    const supplierObj: any = items.find((x) => x.suppliers)?.suppliers || {};
    const supplierName =
      supplierObj.company_name ||
      supplierOptions.find((x) => x.value === supplierId)?.label ||
      supplierId;

    const today = new Date();
    const poDateLong = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(today);
    const yymmdd = `${String(today.getFullYear()).slice(2)}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const firstShipment: any = items.find((x) => x.shipments)?.shipments || {};
    const commodityRaw =
      firstShipment.commodity ||
      items[0]?.description ||
      'GOODS';
    const commodityShort = String(commodityRaw)
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .trim()
      .toUpperCase()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    const supplierShort = String(supplierName)
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .trim()
      .toUpperCase()
      .split(/\s+/)[0]
      ?.slice(0, 4) || 'SUP';

    const poNumber = `ANLE-${commodityShort}-${supplierShort}-${yymmdd}`;

    const currency = items[0]?.currency || 'USD';

    const rows = items.map((it) => {
      const price = Number(it.rate || 0);
      const qty = Number(it.quantity || 0);
      const lineTotal = price * qty;
      let netWeightTons: number | null = null;
      let grossWeightTons: number | null = null;
      const u = (it.unit || '').toLowerCase();
      if (u.includes('bag')) {
        netWeightTons = (qty * 10) / 1000;
        grossWeightTons = (qty * 10.01) / 1000;
      } else if (u.includes('ton') || u.includes('tấn') || u.includes('tan')) {
        netWeightTons = qty;
        grossWeightTons = qty;
      }
      return {
        description: it.description || '—',
        price,
        netWeightTons,
        grossWeightTons,
        units: `${qty.toLocaleString('en-US')} ${it.unit || ''}`.trim(),
        lineTotal,
      };
    });
    const total = rows.reduce((s, r) => s + r.lineTotal, 0);

    const specRaw = (items[0]?.specification || '').trim();
    const specLeft = specRaw
      ? specRaw
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [
          '(PACKED IN 10KG MESH BAGS)',
          'COLOR: NATURAL RED TO LIGHT PURPLE',
          'MOISTURE CONTENT MAX: 6 - 8%',
          'FOREIGN MATTER: MAX 0.1%',
          'DEFECTIVE: MAX 2%',
        ];

    const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const specRight: { label: string; value: string }[] = [
      { label: 'Incoterm', value: firstShipment.incoterm || items[0]?.note?.match(/incoterm[:\s]+([A-Z]{3,4})/i)?.[1] || 'CNF' },
      { label: 'Payment method', value: '20% advance 80% against' },
      { label: 'NET weight', value: rows[0]?.netWeightTons ? `${totalQty} x 10kg = ${(totalQty * 10).toLocaleString('en-US')}kg` : '—' },
      { label: 'GROSS weight', value: rows[0]?.grossWeightTons ? `${totalQty} x 10,1kg = ${Math.round(totalQty * 10.01).toLocaleString('en-US')}kg` : '—' },
      { label: 'Container', value: firstShipment.container_count ? `${firstShipment.container_count}x40' FT` : "2x40' FT" },
      { label: 'Shipping line', value: firstShipment.shipping_line || 'Direct' },
    ];

    setPurchaseOrderDoc({
      poNumber,
      poDateLong,
      currency,
      buyer: {
        name: 'ANLE-SCM LIMITED COMPANY',
        address: '571/23 Pham Van Bach Street, Tan Son Ward, Ho Chi Minh City, Viet Nam',
        tel: '+84 962 787 877',
        website: 'anle-scm.com',
        email: 'mgm@anle-scm.com',
      },
      seller: {
        name: supplierName,
        address: supplierObj.address || '—',
        tel: supplierObj.phone || '—',
        email: supplierObj.email || '—',
      },
      rows,
      total,
      specLeft,
      specRight,
      confirmRight: supplierName,
    });

    await new Promise((r) => setTimeout(r, 80));
    if (!poPage1Ref.current || !poPage2Ref.current) {
      toastError('Could not generate PDF');
      return;
    }

    const safeSupplier = supplierName.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60);
    await downloadMultiPagePdf(
      [poPage1Ref.current, poPage2Ref.current],
      `PurchaseOrder_${safeSupplier}_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
    toastSuccess('Purchase Order exported');
  };

  const handleExportPaymentRequestPdf = async () => {
    const selected = purchasingItems.filter((i) => selectedItems.includes(i.id));
    if (selected.length === 0) {
      toastError('Please select at least 1 purchasing item');
      return;
    }
    await exportPurchaseOrderPdfForItems(selected);
  };

  const handleExportRowPdf = async (item: PurchasingItem) => {
    await exportPurchaseOrderPdfForItems([item]);
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
      {/* Hidden PDF template - Purchase Order (2 pages) */}
      <div className="fixed left-[-99999px] top-0 w-[900px]">
        {purchaseOrderDoc ? (
          <div className="po-root">
            <style dangerouslySetInnerHTML={{ __html: PURCHASE_ORDER_CSS }} />

            <div className="po-page" ref={poPage1Ref}>
              <header className="po-header">
                <div className="po-logo">
                  <img src={companyLogoSrc()} alt="ANLE-SCM Logo" />
                </div>
                <div className="po-co-block">
                  <div className="po-co-name">CÔNG TY TNHH ANLE - SCM</div>
                  <div className="po-co-info">
                    571/23 đường Phạm Văn Bạch, phường Tân Sơn, thành phố Hồ Chí Minh
                    <br />Tel: 0962 787 877
                    <br />Email: mgm@anle-scm.com
                  </div>
                </div>
              </header>

              <div className="po-title">PURCHASE ORDER</div>
              <div className="po-num">{purchaseOrderDoc.poNumber}</div>
              <div className="po-date">{purchaseOrderDoc.poDateLong}</div>

              <div className="po-parties">
                <div className="po-party">
                  <div className="row"><span className="lbl">Buyer:</span> <strong>{purchaseOrderDoc.buyer.name}</strong></div>
                  <div className="row"><span className="lbl">Address:</span> {purchaseOrderDoc.buyer.address}</div>
                  <div className="row"><span className="lbl">Tel:</span> {purchaseOrderDoc.buyer.tel}</div>
                  <div className="row"><span className="lbl">Website:</span> {purchaseOrderDoc.buyer.website}</div>
                  <div className="row"><span className="lbl">Email:</span> {purchaseOrderDoc.buyer.email}</div>
                </div>
                <div className="po-party">
                  <div className="row"><span className="lbl">Seller:</span> <strong>{purchaseOrderDoc.seller.name}</strong></div>
                  <div className="row"><span className="lbl">Address:</span> {purchaseOrderDoc.seller.address}</div>
                  <div className="row"><span className="lbl">Tel:</span> {purchaseOrderDoc.seller.tel}</div>
                  <div className="row"><span className="lbl">Email:</span> {purchaseOrderDoc.seller.email}</div>
                </div>
              </div>

              <div className="po-currency">Unit of currency: {purchaseOrderDoc.currency}</div>

              <div className="po-section-title">DETAIL OF SHIPMENT</div>
              <table className="po-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}></th>
                    <th style={{ width: '12%' }}>Price<br />(Rate)</th>
                    <th style={{ width: '14%' }}>Net weight<br />(Tons)</th>
                    <th style={{ width: '14%' }}>Gross weight<br />(Tons)</th>
                    <th style={{ width: '14%' }}>Units</th>
                    <th style={{ width: '14%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrderDoc.rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="desc">{r.description}</td>
                      <td className="num">{r.price.toLocaleString('en-US')} {purchaseOrderDoc.currency === 'USD' ? '$' : purchaseOrderDoc.currency}</td>
                      <td className="num">{r.netWeightTons != null ? r.netWeightTons.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</td>
                      <td className="num">{r.grossWeightTons != null ? r.grossWeightTons.toLocaleString('en-US', { maximumFractionDigits: 3 }) : '—'}</td>
                      <td className="num">{r.units}</td>
                      <td className="num">{r.lineTotal.toLocaleString('en-US', { maximumFractionDigits: 3 })} {purchaseOrderDoc.currency === 'USD' ? '$' : purchaseOrderDoc.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="po-total">Total: {purchaseOrderDoc.total.toLocaleString('en-US', { maximumFractionDigits: 3 })} {purchaseOrderDoc.currency}</div>
              <div className="po-foot-line"></div>
            </div>

            <div className="po-page" ref={poPage2Ref}>
              <div className="po-section-title">SPECIFICATION</div>
              <div className="po-spec-grid">
                <div className="po-spec-cell">
                  {purchaseOrderDoc.specLeft.map((line, idx) => (
                    <div key={idx} className="row">{line}</div>
                  ))}
                </div>
                <div className="po-spec-cell">
                  {purchaseOrderDoc.specRight.map((kv, idx) => (
                    <div key={idx} className="row"><em>{kv.label}:</em> {kv.value}</div>
                  ))}
                </div>
              </div>

              <div style={{ height: 80 }} />

              <div className="po-section-title">PURCHASE ORDER CONFIRMATION</div>
              <div className="po-confirm-grid">
                <div className="po-confirm-cell">
                  <div className="po-confirm-head">Person in charge</div>
                  <div className="name">ANLE-SCM LIMITED COMPANY</div>
                  <div>Address: 571/23 Pham Van Bach Street, Tan Son ward, Ho Chi Minh City</div>
                  <div>Tel: 0962787877</div>
                  <div>Website: anle-scm.com</div>
                </div>
                <div className="po-confirm-cell">
                  <div className="po-confirm-head">Seller</div>
                  <div className="name">{purchaseOrderDoc.confirmRight}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

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
                      <span className="text-[11px] font-bold text-primary">{item.shipments?.code || `#${item.shipment_id.slice(0, 8)}`}</span>
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
                  <th className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-border/40 w-[148px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>ACTIONS</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void handleExportPaymentRequestPdf(); }}
                        disabled={selectedItems.length === 0}
                        className={clsx(
                          'inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm transition-all',
                          selectedItems.length > 0
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed',
                        )}
                        title={selectedItems.length > 0 ? 'Export Purchase Order PDF' : 'Select items to export'}
                      >
                        <DollarSign size={13} />
                        PDF
                      </button>
                    </div>
                  </th>
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
                            type="button"
                            onClick={() => void handleExportRowPdf(item)}
                            className="p-1.5 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                            title="Export Purchase Order PDF"
                          >
                            <DollarSign size={14} />
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
        exchangeRates={exchangeRates}
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
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isProcessing={isDeleting}
        message={
          <>
            Are you sure you want to delete {confirmAction.type === 'bulk' ? `these ${selectedItems.length} items` : 'this item'}?
            All associated data will be permanently removed.
          </>
        }
      />
    </div>
  );
};

export default PurchasingPage;
