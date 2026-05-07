import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, RefreshCcw, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { purchasingService, type PurchasingItem } from '../../services/purchasingService';
import { shipmentService } from '../../services/shipmentService';
import { supplierService } from '../../services/supplierService';
import { employeeService } from '../../services/employeeService';
import { exchangeRateService, type ExchangeRate } from '../../services/exchangeRateService';
import PurchasingDialog from '../purchasing/dialogs/PurchasingDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToastContext } from '../../contexts/ToastContext';

const th = 'px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 whitespace-nowrap';
const td = 'px-3 py-2 text-[12px] border-b border-border/40 align-middle';

const money = (n: any) => {
  const v = Number(n || 0);
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(v));
};

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
  note: '',
};

const TradingSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: toastOk, error: toastErr } = useToastContext();
  const [items, setItems] = useState<PurchasingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Dialog State (reuse Purchasing dialog for quick create)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dialogMode] = useState<'add' | 'edit' | 'detail'>('add');
  const [formState, setFormState] = useState<Partial<PurchasingItem>>(INITIAL_FORM_STATE);

  // Options
  const [shipmentOptions, setShipmentOptions] = useState<{ value: string; label: string }[]>([]);
  const [fullShipments, setFullShipments] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ value: string; label: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ value: string; label: string }[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await purchasingService.getPurchasingItems(1, 200);
      setItems(Array.isArray(data) ? data : []);
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
        exchangeRateService.getAll(),
      ]);
      setFullShipments(shipments as any[]);
      setShipmentOptions((shipments as any[]).map((s) => ({ value: s.id, label: `${s.code || '#' + s.id.slice(0, 8)} - ${s.commodity}` })));
      setSupplierOptions((suppliers as any[]).map((s) => ({ value: s.id, label: s.company_name })));
      setEmployeeOptions((employees as any[]).map((e) => ({ value: e.id, label: e.full_name })));
      setExchangeRates(rates as ExchangeRate[]);
    } catch (e) {
      console.error(e);
      toastErr('Failed to load options');
    }
  };

  useEffect(() => {
    void fetchData();
    void fetchOptions();
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const supplierName = (it.suppliers?.company_name || '').toLowerCase();
      const shipNo = (it.shipments?.code || it.shipment_id || '').toLowerCase();
      const desc = (it.description || '').toLowerCase();
      const hs = (it.hs_code || '').toLowerCase();
      return supplierName.includes(q) || shipNo.includes(q) || desc.includes(q) || hs.includes(q) || it.id.toLowerCase().includes(q);
    });
  }, [items, searchText]);

  const setFormField = (key: any, value: any) => {
    setFormState((prev) => {
      const next: any = { ...prev, [key]: value };
      if (key === 'shipment_id' && value) {
        const shipment = fullShipments.find((s) => s.id === value);
        if (shipment && shipment.supplier_id) {
          next.supplier_id = shipment.supplier_id;
        }
      }
      return next;
    });
  };

  const openNew = () => {
    setFormState({ ...INITIAL_FORM_STATE, created_by_id: user?.id });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDialogOpen(false);
      setIsClosing(false);
    }, 350);
  };

  const handleSave = async () => {
    try {
      const createPayload: any = {
        ...formState,
        created_by_id: (formState as any).created_by_id || user?.id,
      };
      await purchasingService.createPurchasingItem(createPayload);
      toastOk('Created successfully');
      closeDialog();
      await fetchData();
    } catch (e: any) {
      toastErr(e?.message || 'Failed to create');
    }
  };

  return (
    <div className="w-full">
      <PurchasingDialog
        isOpen={isDialogOpen}
        isClosing={isClosing}
        mode={dialogMode}
        onClose={closeDialog}
        formState={formState}
        setFormField={setFormField}
        shipmentOptions={shipmentOptions}
        supplierOptions={supplierOptions}
        employeeOptions={employeeOptions}
        exchangeRates={exchangeRates}
        onSave={() => void handleSave()}
      />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/operations')}
            className="p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg flex items-center justify-center bg-card border border-border shadow-sm"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-foreground truncate">Trading Sale</h1>
            <p className="text-[12px] text-muted-foreground font-medium">Sales list for Trading module.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search shipment, supplier, HS code…"
              className="w-[320px] pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-[13px] font-medium"
            />
          </div>
          <button
            onClick={() => void fetchData()}
            className={clsx(
              'px-3 py-2 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm',
              loading && 'opacity-70',
            )}
            title="Refresh"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[12px] font-black text-white shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-95"
            title="New"
          >
            <Plus size={16} />
            New
          </button>
        </div>
      </div>

      <div className="sm:hidden mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search shipment, supplier, HS code…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-[13px] font-medium"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[2200px] w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
              <tr>
                <th className={th}>ID</th>
                <th className={th}>ID hợp đồng</th>
                <th className={th}>Sản phẩm</th>
                <th className={th}>Shipment No.</th>
                <th className={th}>Supplier</th>
                <th className={th}>Name of supplier</th>
                <th className={th}>Shipment ID</th>
                <th className={th}>HS Code</th>
                <th className={th}>Product</th>
                <th className={th}>Description</th>
                <th className={th}>Quantity</th>
                <th className={th}>Unit</th>
                <th className={th}>Cost</th>
                <th className={th}>Tax</th>
                <th className={th}>Tax Value</th>
                <th className={th}>PIC</th>
                <th className={th}>Currency</th>
                <th className={th}>Exchange Rate</th>
                <th className={th}>Total</th>
                <th className={th}>Specification</th>
                <th className={th}>Note</th>
                <th className={th}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className={clsx(td, 'text-slate-300')} colSpan={22}>Loading…</td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className={clsx(td, 'py-10 text-center text-muted-foreground italic')} colSpan={22}>
                    No data
                  </td>
                </tr>
              ) : (
                filtered.map((it) => {
                  const shipmentNo = it.shipments?.code || `#${it.shipment_id?.slice(0, 8)}`;
                  const supplierName = it.suppliers?.company_name || '—';
                  const contractId = it.shipments?.contract_id || it.shipments?.contract?.id || '';
                  const contractCode = it.shipments?.contract?.code || '';
                  return (
                    <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className={clsx(td, 'font-mono text-[11px] text-slate-600')}>{it.id.slice(0, 8)}</td>
                      <td className={td}>{contractCode || (contractId ? String(contractId).slice(0, 8) : '—')}</td>
                      <td className={td}>{(it as any).product || '—'}</td>
                      <td className={td}><span className="font-bold text-primary">{shipmentNo}</span></td>
                      <td className={clsx(td, 'font-mono text-[11px] text-slate-600')}>{it.supplier_id?.slice(0, 8)}</td>
                      <td className={td}>{supplierName}</td>
                      <td className={clsx(td, 'font-mono text-[11px] text-slate-600')}>{it.shipment_id?.slice(0, 8)}</td>
                      <td className={td}>{it.hs_code || '—'}</td>
                      <td className={td}>{(it as any).product_name || (it as any).product || '—'}</td>
                      <td className={clsx(td, 'max-w-[360px] truncate')}>{it.description || '—'}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{it.quantity}</td>
                      <td className={td}>{it.unit}</td>
                      <td className={clsx(td, 'text-right tabular-nums font-bold text-slate-800')}>{money(it.total)}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{it.tax_percent}%</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{money(it.tax_value)}</td>
                      <td className={td}>{it.pic?.full_name || '—'}</td>
                      <td className={td}>{it.currency || '—'}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{it.exchange_rate}</td>
                      <td className={clsx(td, 'text-right tabular-nums font-black text-primary')}>{money(it.total)}</td>
                      <td className={clsx(td, 'max-w-[260px] truncate')}>{it.specification || '—'}</td>
                      <td className={clsx(td, 'max-w-[260px] truncate')}>{it.note || '—'}</td>
                      <td className={clsx(td, 'text-right tabular-nums')}>{it.rate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingSalePage;

