import React from 'react';
import { createPortal } from 'react-dom';
import {
  Barcode,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Save,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../../components/ui/button';
import { DateInput } from '../../../components/ui/DateInput';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { CreateCustomerDto, Customer } from '../../../services/customerService';
import type { CreateTradingSaleDto } from '../../../services/tradingSalesService';
import { computeTradingSaleDerived } from '../tradingSaleCalculations';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  draft: CreateTradingSaleDto;
  customers: Customer[];
  saving: boolean;
  isNewCustomer: boolean;
  newCustomer: Partial<CreateCustomerDto>;
  isSavingCustomer: boolean;
  onClose: () => void;
  onSave: () => void;
  onCreateCustomer: () => void;
  setIsNewCustomer: React.Dispatch<React.SetStateAction<boolean>>;
  setNewCustomer: React.Dispatch<React.SetStateAction<Partial<CreateCustomerDto>>>;
  setDraft: React.Dispatch<React.SetStateAction<CreateTradingSaleDto>>;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(value || 0));

const formatDecimalNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 }).format(value || 0);

const splitDecimalInput = (raw: string) => {
  const compact = String(raw || '').replace(/\s+/g, '');
  const decimalIndex = compact.indexOf(',');

  if (decimalIndex === -1) {
    return {
      integerDigits: compact.replace(/\D/g, ''),
      decimalDigits: '',
      hasDecimalSeparator: false,
    };
  }

  return {
    integerDigits: compact.slice(0, decimalIndex).replace(/\D/g, ''),
    decimalDigits: compact.slice(decimalIndex + 1).replace(/\D/g, ''),
    hasDecimalSeparator: true,
  };
};

const formatDecimalInput = (raw: string) => {
  const { integerDigits, decimalDigits, hasDecimalSeparator } = splitDecimalInput(raw);
  const formattedInteger = integerDigits ? formatNumber(Number(integerDigits)) : '';
  if (!hasDecimalSeparator) return formattedInteger;
  return `${formattedInteger || '0'},${decimalDigits}`;
};

const parseFormattedDecimal = (raw: string): number => {
  const { integerDigits, decimalDigits, hasDecimalSeparator } = splitDecimalInput(raw);
  const normalized = `${integerDigits || '0'}${hasDecimalSeparator ? `.${decimalDigits}` : ''}`;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const parseLooseNumber = (raw: string): number => {
  const normalized = String(raw || '')
    .replace(/\s+/g, '')
    .replace(/[.,](?=\d{3}(\D|$))/g, '')
    .replace(/,/g, '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const inputBase =
  'w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all disabled:bg-muted/10 disabled:text-muted-foreground';

const FieldLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex items-center gap-2 mb-1.5">
    {icon}
    <label className="text-[13px] font-bold text-foreground">{children}</label>
  </div>
);

const TradingSaleDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  draft,
  customers,
  saving,
  isNewCustomer,
  newCustomer,
  isSavingCustomer,
  onClose,
  onSave,
  onCreateCustomer,
  setIsNewCustomer,
  setNewCustomer,
  setDraft,
}) => {
  const [exchangeRateInput, setExchangeRateInput] = React.useState(() =>
    draft.exchange_rate ? formatDecimalNumber(draft.exchange_rate) : '',
  );
  const [quantityInput, setQuantityInput] = React.useState(() =>
    draft.quantity ? formatDecimalNumber(draft.quantity) : '',
  );

  if (!isOpen && !isClosing) return null;

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.company_name || customer.local_name || customer.english_name || customer.id,
  }));
  const selectedCustomer = customers.find((customer) => customer.id === draft.customer_id);
  const canCreateCustomer = Boolean(newCustomer.company_name && newCustomer.code && newCustomer.code.length === 3);

  const setField = <K extends keyof CreateTradingSaleDto>(key: K, value: CreateTradingSaleDto[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const setNumberField = (key: 'exchange_rate' | 'quantity' | 'price_usd' | 'payment_percent', raw: string) => {
    const value = parseLooseNumber(raw);
    const next = { ...draft, [key]: value };
    const { amountUsd, totalVnd } = computeTradingSaleDerived(next);
    setDraft({ ...next, amount_usd: amountUsd, total_vnd: totalVnd });
  };

  const setFormattedDecimalField = (key: 'exchange_rate' | 'quantity', raw: string) => {
    const formatted = formatDecimalInput(raw);
    const value = parseFormattedDecimal(raw);
    const next = { ...draft, [key]: value };
    const { amountUsd, totalVnd } = computeTradingSaleDerived(next);
    if (key === 'exchange_rate') setExchangeRateInput(formatted);
    if (key === 'quantity') setQuantityInput(formatted);
    setDraft({ ...next, amount_usd: amountUsd, total_vnd: totalVnd });
  };

  const normalizeFormattedDecimalField = (key: 'exchange_rate' | 'quantity') => {
    const value = Number(draft[key] || 0);
    const formatted = value ? formatDecimalNumber(value) : '';
    if (key === 'exchange_rate') setExchangeRateInput(formatted);
    if (key === 'quantity') setQuantityInput(formatted);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((item) => item.id === customerId);
    setDraft((previous) => ({
      ...previous,
      customer_id: customer?.id || null,
      customer_company_name: customer?.company_name || customer?.local_name || customer?.english_name || '',
      customer_tax_code: customer?.tax_code || '',
      customer_address: customer ? (customer.office_address || customer.address || customer.bl_address || '') : '',
    }));
  };

  const setNewCustomerField = <K extends keyof CreateCustomerDto>(key: K, value: CreateCustomerDto[K]) => {
    setNewCustomer((previous) => ({ ...previous, [key]: value }));
  };

  const resetNewCustomer = () => {
    setIsNewCustomer(false);
    setNewCustomer({ company_name: '', code: '' });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out',
          isClosing ? 'opacity-0' : 'animate-in fade-in duration-300',
        )}
        onClick={onClose}
      />

      <div
        className={clsx(
          'relative w-full max-w-[720px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">Add Trading Sale</h2>
              <p className="text-[12px] text-muted-foreground font-medium truncate">
                Create a new record in the trading_sales table.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-blue-50 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">Customer Information</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewCustomer}
                  onChange={(event) => {
                    setIsNewCustomer(event.target.checked);
                    if (event.target.checked) {
                      setNewCustomer({ company_name: '', code: '', address: '', phone: '', email: '', tax_code: '' });
                    }
                  }}
                  className="rounded border-blue-200 text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-[11px] font-bold text-blue-600/70 uppercase">Create New Customer</span>
              </label>
            </div>

            <div className="p-5">
              {!isNewCustomer ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Select Customer</label>
                  </div>
                  <SearchableSelect
                    options={customerOptions}
                    value={draft.customer_id || undefined}
                    onValueChange={handleCustomerChange}
                    placeholder="Select customer..."
                    searchPlaceholder="Search customer..."
                    emptyMessage="No customer found."
                  />

                  {selectedCustomer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-blue-50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Barcode size={12} className="opacity-70" />
                          Code
                        </label>
                        <input readOnly value={selectedCustomer.code || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Hash size={12} className="opacity-70" />
                          Tax Code
                        </label>
                        <input readOnly value={selectedCustomer.tax_code || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Phone size={12} className="opacity-70" />
                          Phone
                        </label>
                        <input readOnly value={selectedCustomer.phone || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail size={12} className="opacity-70" />
                          Email
                        </label>
                        <input readOnly value={selectedCustomer.email || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin size={12} className="opacity-70" />
                          Address
                        </label>
                        <input readOnly value={selectedCustomer.office_address || selectedCustomer.address || selectedCustomer.bl_address || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <FieldLabel icon={<Package size={16} className="text-blue-600/70" />}>
                        Company Name <span className="text-red-500">*</span>
                      </FieldLabel>
                      <input
                        type="text"
                        value={newCustomer.company_name || ''}
                        onChange={(event) => setNewCustomerField('company_name', event.target.value)}
                        placeholder="Enter company name"
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel icon={<Barcode size={16} className="text-blue-600/70" />}>
                        Customer Code (3 Chars) <span className="text-red-500">*</span>
                      </FieldLabel>
                      <input
                        type="text"
                        maxLength={3}
                        value={newCustomer.code || ''}
                        onChange={(event) => setNewCustomerField('code', event.target.value.toUpperCase().slice(0, 3))}
                        placeholder="E.g. ZJS"
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold tracking-widest placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel icon={<Mail size={16} className="text-blue-600/70" />}>Email</FieldLabel>
                      <input
                        type="email"
                        value={newCustomer.email || ''}
                        onChange={(event) => setNewCustomerField('email', event.target.value)}
                        placeholder="customer@email.com"
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel icon={<Phone size={16} className="text-blue-600/70" />}>Phone</FieldLabel>
                      <input
                        type="text"
                        value={newCustomer.phone || ''}
                        onChange={(event) => setNewCustomerField('phone', event.target.value)}
                        placeholder="Phone number"
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel icon={<Hash size={16} className="text-blue-600/70" />}>Tax Code</FieldLabel>
                      <input
                        type="text"
                        value={newCustomer.tax_code || ''}
                        onChange={(event) => setNewCustomerField('tax_code', event.target.value)}
                        placeholder="Tax identification number"
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium placeholder:text-blue-500/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel icon={<MapPin size={16} className="text-blue-600/70" />}>Address</FieldLabel>
                      <input
                        type="text"
                        value={newCustomer.address || ''}
                        onChange={(event) => setNewCustomerField('address', event.target.value)}
                        placeholder="Address"
                        className="w-full px-4 py-2 bg-blue-50/30 border border-blue-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium placeholder:text-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSavingCustomer || !canCreateCustomer}
                      onClick={onCreateCustomer}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-all shadow-md active:scale-[0.98]',
                        isSavingCustomer || !canCreateCustomer
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200',
                      )}
                    >
                      {isSavingCustomer ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                      Confirm & Save Customer
                    </button>
                    <button
                      type="button"
                      disabled={isSavingCustomer}
                      onClick={resetNewCustomer}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-slate-500 hover:text-slate-700 hover:bg-white bg-white/50 transition-all border border-slate-200 shadow-sm"
                    >
                      <XCircle size={18} />
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <Package size={18} className="text-primary" />
              <h3 className="text-[14px] font-black text-foreground">Trading Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Trade date</FieldLabel>
                <DateInput value={draft.trade_date || ''} onChange={(value) => setField('trade_date', value)} />
              </div>
              <div>
                <FieldLabel icon={<Hash size={16} className="text-muted-foreground/70" />}>Supplier ID</FieldLabel>
                <input className={inputBase} value={draft.supplier_id || ''} readOnly />
              </div>
              <div>
                <FieldLabel>Commodity Code</FieldLabel>
                <input
                  className={inputBase}
                  value={draft.commodity_code || ''}
                  onChange={(event) => setField('commodity_code', event.target.value)}
                  placeholder="S17"
                />
              </div>
              <div>
                <FieldLabel>Unit</FieldLabel>
                <input
                  className={inputBase}
                  value={draft.unit || ''}
                  onChange={(event) => setField('unit', event.target.value)}
                  placeholder="Tons"
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Name of Commodity</FieldLabel>
                <input
                  className={inputBase}
                  value={draft.commodity_name || ''}
                  onChange={(event) => setField('commodity_name', event.target.value)}
                  placeholder="Ớt khô nguyên quả có cuống S17 Ấn Độ"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <DollarSign size={18} className="text-primary" />
              <h3 className="text-[14px] font-black text-foreground">Pricing</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Currency (exchange rate)</FieldLabel>
                <input
                  inputMode="decimal"
                  className={clsx(inputBase, 'text-right tabular-nums')}
                  value={exchangeRateInput}
                  onChange={(event) => setFormattedDecimalField('exchange_rate', event.target.value)}
                  onBlur={() => normalizeFormattedDecimalField('exchange_rate')}
                  placeholder="Enter exchange rate"
                />
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  Type <span className="font-bold text-foreground">,</span> to enter decimals; digits before the comma are grouped with <span className="font-bold text-foreground">.</span> every 3 digits.
                </p>
              </div>
              <div>
                <FieldLabel>Quantity</FieldLabel>
                <input
                  inputMode="decimal"
                  className={clsx(inputBase, 'text-right tabular-nums')}
                  value={quantityInput}
                  onChange={(event) => setFormattedDecimalField('quantity', event.target.value)}
                  onBlur={() => normalizeFormattedDecimalField('quantity')}
                />
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  Type <span className="font-bold text-foreground">,</span> to enter decimals; for example <span className="font-bold text-foreground">1,25</span>.
                </p>
              </div>
              <div>
                <FieldLabel>Price (USD)</FieldLabel>
                <input
                  inputMode="decimal"
                  className={clsx(inputBase, 'text-right tabular-nums')}
                  value={draft.price_usd ? formatNumber(draft.price_usd) : ''}
                  onChange={(event) => setNumberField('price_usd', event.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Payment (%)</FieldLabel>
                <input
                  inputMode="decimal"
                  className={clsx(inputBase, 'text-right tabular-nums')}
                  value={draft.payment_percent ? formatNumber(draft.payment_percent) : ''}
                  onChange={(event) => setNumberField('payment_percent', event.target.value)}
                  placeholder="30"
                />
              </div>
              <div>
                <FieldLabel>Amount (USD)</FieldLabel>
                <input
                  readOnly
                  className={clsx(inputBase, 'text-right tabular-nums bg-muted/10')}
                  value={formatNumber(Number(draft.amount_usd || 0))}
                />
              </div>
              <div>
                <FieldLabel>Total (VND)</FieldLabel>
                <input
                  readOnly
                  className={clsx(inputBase, 'text-right tabular-nums bg-muted/10')}
                  value={formatNumber(Number(draft.total_vnd || 0))}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Note</FieldLabel>
                <textarea
                  rows={3}
                  className={clsx(inputBase, 'resize-y')}
                  value={draft.note || ''}
                  onChange={(event) => setField('note', event.target.value)}
                  placeholder="Notes..."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20 group">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TradingSaleDialog;
