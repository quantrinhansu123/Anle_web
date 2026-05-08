import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Plus, RefreshCcw, Save, X, Trash2, Printer } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { tradingSalesService, type TradingSale, type CreateTradingSaleDto } from '../../services/tradingSalesService';
import { useToastContext } from '../../contexts/ToastContext';
import { customerService, type Customer } from '../../services/customerService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(value || 0));

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB').format(date);
};

const inputBase =
  'w-full rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30';

const computeDerived = (d: CreateTradingSaleDto) => {
  const price = Number(d.price_usd || 0);
  const qty = Number(d.quantity || 0);
  const payment = Number(d.payment_percent || 0) / 100;
  const rate = Number(d.exchange_rate || 0);
  const amountUsd = price * qty;
  const totalVnd = amountUsd * payment * rate;
  return { amountUsd, totalVnd };
};

const parseLooseNumber = (raw: string): number => {
  const s = String(raw || '')
    .replace(/\s+/g, '')
    .replace(/[.,](?=\d{3}(\D|$))/g, '') // remove thousand separators like "." or ","
    .replace(/,/g, '.'); // treat comma as decimal separator if any
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const nextSupplierId = (existing: Array<string | null | undefined>): string => {
  let max = 0;
  for (const v of existing) {
    const m = String(v || '').match(/^SUP(\d{1,})$/i);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    if (Number.isFinite(num)) max = Math.max(max, num);
  }
  const next = max + 1;
  return `SUP${String(next).padStart(3, '0')}`;
};

function companyLogoSrc(): string {
  if (import.meta.env.DEV) return '/appsheet-brand-logo';
  return 'https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2fe6a56fae.%E1%BA%A2nh.064359.png';
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

const TradingSalePage: React.FC = () => {
  const navigate = useNavigate();
  const { success: toastOk, error: toastErr } = useToastContext();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TradingSale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page] = useState(1);
  const [limit] = useState(100);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<CreateTradingSaleDto>({
    trade_date: new Date().toISOString().slice(0, 10),
    commodity_code: 'S17',
    commodity_name: 'Ớt khô nguyên quả có cuống S17 Ấn Độ',
    unit: 'Tons',
    price_usd: 0,
    quantity: 0,
    amount_usd: 0,
    payment_percent: 0,
    exchange_rate: 0,
    total_vnd: 0,
    note: '',
    shipment_id: null,
    supplier_id: null,
    customer_id: null,
    customer_company_name: '',
    customer_tax_code: '',
    customer_address: '',
  });
  const [savingDraft, setSavingDraft] = useState(false);
  const [printRow, setPrintRow] = useState<TradingSale | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await tradingSalesService.getTradingSales(page, limit);
      setRows(res.items || []);
    } catch (e: any) {
      toastErr(e?.message || 'Failed to fetch trading sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    void (async () => {
      try {
        const list = await customerService.getCustomers().catch(() => []);
        setCustomers(Array.isArray(list) ? list : []);
      } catch {
        // ignore
      }
    })();
  }, []);

  const tableRows = useMemo(() => {
    return rows.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [rows]);

  const startAdd = () => {
    const supplierAuto = nextSupplierId(rows.map((r) => r.supplier_id));
    setDraft({
      trade_date: new Date().toISOString().slice(0, 10),
      commodity_code: 'S17',
      commodity_name: 'Ớt khô nguyên quả có cuống S17 Ấn Độ',
      unit: 'Tons',
      price_usd: 0,
      quantity: 0,
      amount_usd: 0,
      payment_percent: 0,
      exchange_rate: 0,
      total_vnd: 0,
      note: '',
      shipment_id: null,
      supplier_id: supplierAuto,
      customer_id: null,
      customer_company_name: '',
      customer_tax_code: '',
      customer_address: '',
    });
    setAddOpen(true);
  };

  const cancelAdd = () => setAddOpen(false);

  const saveAdd = async () => {
    try {
      setSavingDraft(true);
      const { amountUsd, totalVnd } = computeDerived(draft);
      const created = await tradingSalesService.createTradingSale({
        ...draft,
        amount_usd: amountUsd,
        total_vnd: totalVnd,
      });
      setRows((prev) => [created, ...prev]);
      setAddOpen(false);
      toastOk('Created');
    } catch (e: any) {
      toastErr(e?.message || 'Create failed');
    } finally {
      setSavingDraft(false);
    }
  };

  const deleteRow = async (id: string) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await tradingSalesService.deleteTradingSale(id);
      setRows((prev) => prev.filter((x) => x.id !== id));
      toastOk('Deleted');
    } catch (e: any) {
      toastErr(e?.message || 'Delete failed');
    }
  };

  const handlePrint = async (row: TradingSale) => {
    setPrintRow(row);
    await new Promise((r) => setTimeout(r, 60));
    if (!printRef.current) {
      toastErr('Could not render print template');
      return;
    }
    try {
      const safeDoc = (row.no_doc || `TS-${row.id.slice(0, 8)}`).replace(/[\\/:*?"<>|]+/g, '-');
      await downloadPdfFromElement(printRef.current, `BaoGia_${safeDoc}.pdf`);
      toastOk('Đã xuất PDF');
    } catch (e: any) {
      toastErr(e?.message || 'Export PDF failed');
    } finally {
      setPrintRow(null);
    }
  };

  const handleCustomerNameChange = (value: string) => {
    const raw = value || '';
    const match: Customer | undefined = customers.find(
      (c) => (c.company_name || '').toLowerCase() === raw.trim().toLowerCase(),
    );
    const matchId = match?.id || null;
    const matchTax = match?.tax_code || '';
    const matchAddr = match ? (match.office_address || match.address || match.bl_address || '') : '';
    setDraft((p) => ({
      ...p,
      customer_id: matchId,
      customer_company_name: raw,
      customer_tax_code: matchTax || (p.customer_id === matchId ? p.customer_tax_code : ''),
      customer_address: matchAddr || (p.customer_id === matchId ? p.customer_address : ''),
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col -mt-2 min-h-0">
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
            <p className="text-[12px] text-muted-foreground font-medium">
              Danh sách Trading Sales (table view).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void fetchData()}
            className="px-3 py-2 rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted transition-all shadow-sm inline-flex items-center gap-2 text-[12px] font-bold active:scale-95"
            title="Refresh"
          >
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-black text-white shadow-md transition-all active:scale-95 bg-primary hover:bg-primary/90 shadow-primary/20"
            title="Add"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto bg-slate-50/20">
          <table className="min-w-[1100px] w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <tr>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 w-40">
                  Doc #
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 w-56">
                  Supplier ID
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 w-64">
                  Customer
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 w-52">
                  Shipment
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 w-28">
                  Code
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 min-w-[320px]">
                  Commodity
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-right border-b border-border/40 w-28">
                  Qty
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-left border-b border-border/40 w-24">
                  Unit
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-border/40 w-32">
                  Trade Date
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-right border-b border-border/40 w-36">
                  Price (USD)
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-right border-b border-border/40 w-28">
                  Amount (USD)
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-right border-b border-border/40 w-24">
                  Payment %
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-right border-b border-border/40 w-32">
                  Currency (Rate)
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-right border-b border-border/40 w-36">
                  Total (VND)
                </th>
                <th className="px-3 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-tight text-center border-b border-border/40 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={12} className="px-4 py-6 bg-slate-50/10 border-b border-border/40" />
                  </tr>
                ))
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-20 text-center italic text-muted-foreground opacity-60">
                    No sales items found.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] font-bold text-primary">
                        {row.no_doc || `TS-${row.id.slice(0, 8)}`}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] font-semibold text-slate-800">
                        <span className="line-clamp-1">{row.supplier_id || '—'}</span>
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] text-slate-700 font-semibold">
                        <span className="line-clamp-1">{row.customer_company_name || '—'}</span>
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] text-slate-700 font-semibold">
                        <span className="line-clamp-1">{row.shipments?.code || (row.shipment_id ? row.shipment_id.slice(0, 8) : '—')}</span>
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] text-slate-700 font-semibold">
                        {row.commodity_code || '—'}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] text-slate-700 font-semibold">
                        <span className="line-clamp-1">{row.commodity_name || '—'}</span>
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-right text-[12px] font-black text-slate-900 tabular-nums">
                        {formatNumber(Number(row.quantity || 0))}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-[12px] text-slate-700 font-semibold">
                        {row.unit || '—'}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-center text-[12px] text-slate-700 font-semibold tabular-nums">
                        {formatDate(row.trade_date)}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-right text-[12px] font-black text-slate-900 tabular-nums">
                        {formatNumber(Number(row.price_usd || 0))}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-right text-[12px] font-bold text-slate-700 tabular-nums">
                        {formatNumber(Number(row.amount_usd || 0))}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-right text-[12px] font-bold text-slate-700 tabular-nums">
                        {formatNumber(Number(row.payment_percent || 0))}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-right text-[12px] font-bold text-slate-700 tabular-nums">
                        {formatNumber(Number(row.exchange_rate || 0))}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-right text-[13px] font-black text-slate-900 tabular-nums">
                        {formatNumber(Number(row.total_vnd || 0))}
                      </td>
                      <td className="px-3 py-4 border-b border-border/40 text-center">
                        <button
                          type="button"
                          onClick={() => void handlePrint(row)}
                          className="p-2 rounded-lg text-indigo-700 hover:bg-indigo-50 transition-all active:scale-95 mr-1"
                          title="Print quotation"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteRow(row.id)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={cancelAdd}
              aria-label="Close"
            />
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-black text-slate-900">Add Trading Sale</div>
                  <div className="text-[12px] text-muted-foreground font-medium">Tạo record mới trong bảng `trading_sales`.</div>
                </div>
                <button
                  type="button"
                  onClick={cancelAdd}
                  className="p-2 rounded-lg border border-border bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Customer name
                  </label>
                  <input
                    list="trading-sale-customer-list"
                    className={inputBase}
                    value={draft.customer_company_name || ''}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    placeholder="Gõ để tìm khách hàng…"
                  />
                  <datalist id="trading-sale-customer-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.company_name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Customer name
                  </label>
                  <input className={inputBase} value={draft.customer_company_name || ''} readOnly />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Tax code
                  </label>
                  <input className={inputBase} value={draft.customer_tax_code || ''} readOnly />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Address
                  </label>
                  <input className={inputBase} value={draft.customer_address || ''} readOnly />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Trade date
                  </label>
                  <input
                    type="date"
                    className={inputBase}
                    value={draft.trade_date || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, trade_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Currency (exchange rate)
                  </label>
                  <input
                    inputMode="decimal"
                    className={clsx(inputBase, 'text-right tabular-nums')}
                    value={draft.exchange_rate ? formatNumber(draft.exchange_rate) : ''}
                    onChange={(e) => {
                      const exchange_rate = parseLooseNumber(e.target.value);
                      const next = { ...draft, exchange_rate };
                      const { amountUsd, totalVnd } = computeDerived(next);
                      setDraft({ ...next, amount_usd: amountUsd, total_vnd: totalVnd });
                    }}
                    placeholder="Tỷ giá tự nhập"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Supplier ID
                  </label>
                  <input
                    className={inputBase}
                    value={draft.supplier_id || ''}
                    readOnly
                  />
                </div>
                <div />

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Commodity Code
                  </label>
                  <input
                    className={inputBase}
                    value={draft.commodity_code || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, commodity_code: e.target.value }))}
                    placeholder="S17"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Unit
                  </label>
                  <input
                    className={inputBase}
                    value={draft.unit || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, unit: e.target.value }))}
                    placeholder="Tons"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Name of Commodity
                  </label>
                  <input
                    className={inputBase}
                    value={draft.commodity_name || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, commodity_name: e.target.value }))}
                    placeholder="Ớt khô nguyên quả có cuống S17 Ấn Độ"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Quantity
                  </label>
                  <input
                    inputMode="decimal"
                    className={clsx(inputBase, 'text-right tabular-nums')}
                    value={draft.quantity ? formatNumber(draft.quantity) : ''}
                    onChange={(e) => {
                      const quantity = parseLooseNumber(e.target.value);
                      const next = { ...draft, quantity };
                      const { amountUsd, totalVnd } = computeDerived(next);
                      setDraft({ ...next, amount_usd: amountUsd, total_vnd: totalVnd });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Price (USD)
                  </label>
                  <input
                    inputMode="decimal"
                    className={clsx(inputBase, 'text-right tabular-nums')}
                    value={draft.price_usd ? formatNumber(draft.price_usd) : ''}
                    onChange={(e) => {
                      const price_usd = parseLooseNumber(e.target.value);
                      const next = { ...draft, price_usd };
                      const { amountUsd, totalVnd } = computeDerived(next);
                      setDraft({ ...next, amount_usd: amountUsd, total_vnd: totalVnd });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Payment (%)
                  </label>
                  <input
                    inputMode="decimal"
                    className={clsx(inputBase, 'text-right tabular-nums')}
                    value={draft.payment_percent ? formatNumber(draft.payment_percent) : ''}
                    onChange={(e) => {
                      const payment_percent = parseLooseNumber(e.target.value);
                      const next = { ...draft, payment_percent };
                      const { amountUsd, totalVnd } = computeDerived(next);
                      setDraft({ ...next, amount_usd: amountUsd, total_vnd: totalVnd });
                    }}
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Amount (USD)
                  </label>
                  <input
                    readOnly
                    className={clsx(inputBase, 'text-right tabular-nums bg-slate-50')}
                    value={formatNumber(Number(draft.amount_usd || 0))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Total (VND) = Amount × Payment × Currency
                  </label>
                  <input
                    readOnly
                    className={clsx(inputBase, 'text-right tabular-nums bg-slate-50')}
                    value={formatNumber(Number(draft.total_vnd || 0))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                    Note
                  </label>
                  <textarea
                    rows={3}
                    className={clsx(inputBase, 'resize-y')}
                    value={draft.note || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))}
                    placeholder="Ghi chú..."
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-border bg-slate-50/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelAdd}
                  className="px-4 py-2 rounded-xl border border-border bg-white text-slate-600 hover:bg-slate-50 transition-all text-[12px] font-bold active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveAdd()}
                  disabled={savingDraft}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-black text-white shadow-md transition-all active:scale-95',
                    savingDraft ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary/90 shadow-primary/20',
                  )}
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Hidden print template */}
      {printRow && (
        <div className="fixed left-[-99999px] top-0 w-[900px]">
          <div
            ref={printRef}
            style={{
              width: 794,
              background: '#fff',
              color: '#111',
              fontFamily: 'Times New Roman, Times, serif',
              fontSize: 12,
            }}
          >
            {(() => {
              const tyGia = Number(printRow.exchange_rate || 0);
              const percent = Number(printRow.payment_percent || 0);
              const priceUsd = Number(printRow.price_usd || 0);
              const qty = Number(printRow.quantity || 0);
              const amountUsd = Number.isFinite(Number(printRow.amount_usd)) ? Number(printRow.amount_usd) : priceUsd * qty;
              const thanhTienVnd = Number.isFinite(Number(printRow.total_vnd))
                ? Number(printRow.total_vnd)
                : amountUsd * (percent / 100) * tyGia;
              const vat = 0;
              const tongCong = thanhTienVnd + vat;

              return (
                <div style={{ padding: '28px 42px 34px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 10, borderBottom: '1.6px solid #c92a2a' }}>
                    <div style={{ width: 92 }}>
                      <img src={companyLogoSrc()} alt="ANLE-SCM Logo" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#c92a2a', fontSize: 14, marginBottom: 4, letterSpacing: '0.01em' }}>
                        CÔNG TY TNHH ANLE - SCM
                      </div>
                      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                        571/23 đường Phạm Văn Bạch, phường Tân Sơn, TP. Hồ Chí Minh, Việt Nam
                        <br />
                        Tel: 0962 787 877
                        <br />
                        Email: mgm@anle-scm.com
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#c92a2a', margin: '14px 0 2px', letterSpacing: '0.04em' }}>
                    PHIẾU BÁO GIÁ
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                    {printRow.no_doc || `TS-${printRow.id.slice(0, 8)}`} — {formatDate(printRow.trade_date)}
                  </div>

                  {/* Customer block */}
                  <div style={{ border: '1.5px solid #c92a2a', marginBottom: 12 }}>
                    <div style={{ padding: '10px 12px', fontSize: 11, lineHeight: 1.6 }}>
                      <div>
                        <span style={{ color: '#c92a2a', fontStyle: 'italic', fontWeight: 600 }}>Khách hàng:</span>{' '}
                        <strong>{printRow.customer_company_name || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#c92a2a', fontStyle: 'italic', fontWeight: 600 }}>MST:</span> {printRow.customer_tax_code || '—'}
                      </div>
                      <div>
                        <span style={{ color: '#c92a2a', fontStyle: 'italic', fontWeight: 600 }}>Địa chỉ:</span> {printRow.customer_address || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Top right exchange + percent like screenshot */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>I. Tiền Cọc</div>
                    <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.5 }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>Tỷ giá :</span> {formatNumber(tyGia)}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700 }}>{formatNumber(percent)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Table like screenshot */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {[
                          { label: 'STT', w: '6%', align: 'center' as const },
                          { label: 'Nội Dung', w: '34%', align: 'center' as const },
                          { label: 'ĐVT', w: '8%', align: 'center' as const },
                          { label: 'Đơn Giá (USD)', w: '10%', align: 'center' as const },
                          { label: 'Số lượng', w: '10%', align: 'center' as const },
                          { label: 'Thành tiền (VND)', w: '14%', align: 'center' as const },
                          { label: 'Thuế VAT', w: '8%', align: 'center' as const },
                          { label: 'Tổng cộng', w: '12%', align: 'center' as const },
                          { label: 'Chú ý', w: '8%', align: 'center' as const },
                        ].map((c) => (
                          <th
                            key={c.label}
                            style={{
                              padding: '8px 6px',
                              border: '1px solid #333',
                              background: '#efefef',
                              fontWeight: 700,
                              textAlign: c.align,
                              width: c.w,
                            }}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'center' }}>1</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'center' }}>
                          {`Cọc ${formatNumber(percent)}% giá trị hàng, ${printRow.commodity_name || '—'} (${printRow.commodity_code || '—'})`}
                        </td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'center' }}>{printRow.unit || '—'}</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right' }}>{formatNumber(priceUsd)}</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right' }}>{formatNumber(qty)}</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right' }}>{formatNumber(thanhTienVnd)}</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right' }}>{vat ? formatNumber(vat) : ''}</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right' }}>{formatNumber(tongCong)}</td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'center' }}>{printRow.note || ''}</td>
                      </tr>
                      {/* Total row */}
                      <tr>
                        <td colSpan={5} style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'center', fontWeight: 700 }}>
                          Tổng Cộng (I)
                        </td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right', fontWeight: 700 }}>
                          {formatNumber(thanhTienVnd)}
                        </td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right', fontWeight: 700 }}>
                          {vat ? formatNumber(vat) : ''}
                        </td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'right', fontWeight: 700 }}>
                          {formatNumber(tongCong)}
                        </td>
                        <td style={{ padding: '10px 6px', border: '1px solid #333', textAlign: 'center', fontWeight: 700 }}>
                          VND
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingSalePage;
