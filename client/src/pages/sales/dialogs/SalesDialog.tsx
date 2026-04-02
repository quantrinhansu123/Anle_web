import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, FileText, Plus, Edit, ChevronRight, Hash, Package,
  DollarSign, Ship, MapPin, Calendar, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { Shipment } from '../../shipments/types';
import type { SalesFormState } from '../types';
import type { ExchangeRate } from '../../../services/exchangeRateService';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  mode: 'add' | 'edit' | 'detail';
  onClose: () => void;
  formState: SalesFormState;
  setFormField: <K extends keyof SalesFormState>(key: K, value: SalesFormState[K]) => void;
  shipmentOptions: (Shipment & { value: string; label: string })[];
  exchangeRates: ExchangeRate[];
  onSave: () => void;
  onEdit?: () => void;
}

const SalesDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  mode,
  onClose,
  formState,
  setFormField,
  shipmentOptions,
  exchangeRates,
  onSave,
  onEdit,
}) => {
  if (!isOpen && !isClosing) return null;

  const isReadOnly = mode === 'detail';
  const { shipment_id, items } = formState;

  // Header and Selected Shipment logic
  const selectedShipment = formState.relatedShipment || shipmentOptions.find(s => s.value === shipment_id);

  // Totals calculations
  let totalTaxValue = 0;
  let totalAmount = 0;
  items.forEach(item => {
    const subtotal = item.rate * item.quantity * item.exchange_rate;
    const itemTax = (subtotal * item.tax_percent) / 100;
    totalTaxValue += itemTax;
    totalAmount += (subtotal + itemTax);
  });

  const handleAddItem = () => {
    const defaultCurrency = items.length > 0 ? items[0].currency : 'VND';
    const defaultExchangeRate = items.length > 0 ? items[0].exchange_rate : 1;
    setFormField('items', [
      ...items,
      {
        description: '',
        rate: 0,
        quantity: 1,
        unit: '',
        currency: defaultCurrency,
        exchange_rate: defaultExchangeRate,
        tax_percent: 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setFormField('items', newItems);
  };

  const updateItem = (index: number, key: keyof typeof items[0], value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    // Auto-convert rate if currency changes
    if (key === 'currency') {
      const newCurrency = value as string;
      const oldExchangeRate = item.exchange_rate || 1;
      let newExchangeRate = 1;

      if (newCurrency !== 'VND') {
        const rateObj = exchangeRates.find(r => r.currency_code === newCurrency);
        if (rateObj) newExchangeRate = rateObj.rate;
      }

      if (item.rate > 0) {
        const newRate = (item.rate * oldExchangeRate) / newExchangeRate;
        item.rate = parseFloat(newRate.toFixed(4));
      }
      
      item.currency = newCurrency;
      item.exchange_rate = newExchangeRate;

      // Also apply this currency to all other items for consistency if it's a bulk rule, 
      // but usually elements in a quote should ideally share the currency or have their own.
      // We will just do it for this item.
    } else {
      (item as any)[key] = value;
    }

    newItems[index] = item;
    setFormField('items', newItems);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out',
          isClosing ? 'opacity-0' : 'animate-in fade-in duration-300',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative w-full max-w-[700px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === 'add' ? 'Create Sales Quotation' : mode === 'edit' ? 'Edit Sales Quotation' : 'Sales Quotation Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* SECTION 1: SHIPMENT LINK */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ship size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Related Shipment</span>
              </div>
              {formState.id && <span className="text-[11px] font-bold text-slate-500">Quote ID: {formState.id.slice(0, 8).toUpperCase()}</span>}
            </div>
            <div className="p-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Select Shipment <span className="text-red-500">*</span></label>
                </div>
                <SearchableSelect
                  options={shipmentOptions}
                  value={shipment_id}
                  onValueChange={(v) => setFormField('shipment_id', v)}
                  placeholder="Search shipment ID..."
                  disabled={isReadOnly || mode === 'edit'} // Usually shouldn't change shipment on edit
                />
                {selectedShipment && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-blue-50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Package size={12} className="opacity-70" /> Commodity</label>
                      <input readOnly value={selectedShipment.commodity || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="opacity-70" /> Route (POL → POD)</label>
                      <div className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 flex items-center gap-2">
                        <span>{selectedShipment.pol || '—'}</span>
                        <span className="opacity-30">→</span>
                        <span>{selectedShipment.pod || '—'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} className="opacity-70" /> ETD / ETA</label>
                      <div className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 flex items-center gap-2">
                        <span className="font-bold">{selectedShipment.etd ? new Date(selectedShipment.etd).toLocaleDateString() : '—'}</span>
                        <span className="opacity-30">/</span>
                        <span className="font-bold">{selectedShipment.eta ? new Date(selectedShipment.eta).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: ITEMS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Quotation Products
              </h3>
              {!isReadOnly && (
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-bold hover:bg-primary/20 transition-all active:scale-95"
                >
                  <Plus size={14} /> Add Product
                </button>
              )}
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 relative group">
                {!isReadOnly && items.length > 1 && (
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Product Info</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-foreground">Description <span className="text-red-500">*</span></label>
                    <textarea
                      placeholder="Enter item description"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold min-h-[60px] disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={item.quantity || ''}
                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-foreground">Unit <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="E.g. Kg, Set"
                        value={item.unit}
                        onChange={e => updateItem(idx, 'unit', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-foreground">Rate <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.rate || ''}
                        onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed text-right text-orange-600 bg-orange-50/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-foreground">Currency <span className="text-red-500">*</span></label>
                      <select
                        value={item.currency}
                        onChange={e => updateItem(idx, 'currency', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <option value="VND">VND</option>
                        {exchangeRates.map(r => (
                          <option key={r.id} value={r.currency_code}>{r.currency_code}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-border mt-3">
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[12px] font-bold text-foreground">Exchange Rate <span className="text-red-500">*</span></label>
                       <input
                        type="number"
                        step="0.0001"
                        placeholder="1.00"
                        value={item.exchange_rate || ''}
                        onChange={e => updateItem(idx, 'exchange_rate', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly || item.currency === 'VND'}
                        className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[12px] font-bold text-foreground">Tax (%) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={item.tax_percent !== undefined ? item.tax_percent : ''}
                        onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  {/* Item Subtotal Preview */}
                  <div className="flex justify-between items-center text-[12px] border-t border-border pt-2 mt-4 text-slate-500">
                    <span className="italic">Line Total:</span>
                    <span className="font-bold text-slate-900">
                      {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format((item.rate * item.quantity * (item.exchange_rate || 1)) * (1 + (item.tax_percent || 0)/100))} VND
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {items.length === 0 && (
               <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-border flex flex-col items-center gap-2">
                 <Package size={24} className="text-slate-300" />
                 <p className="text-sm text-slate-400 font-bold">No products added yet.</p>
               </div>
            )}
          </div>

          {/* SECTION 3: GRAND SUMMARY */}
          {items.length > 0 && (
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5 space-y-3 mt-6">
              <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground font-medium">Total Tax Value:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(totalTaxValue)} VND
                  </span>
              </div>
              <div className="flex items-center justify-between border-t border-primary/10 pt-3">
                  <span className="text-[15px] font-bold text-primary">Grand Total Amount:</span>
                  <span className="text-xl font-black text-primary tabular-nums">
                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(totalAmount)} VND
                  </span>
              </div>
              <p className="text-[10px] text-muted-foreground italic text-right mt-2">
                All prices are converted and merged into base currency (VND).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:block text-right mr-2">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Items</div>
               <div className="text-[16px] font-black text-slate-900 leading-none">{items.length}</div>
             </div>
            {isReadOnly ? (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-8 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all group active:scale-95"
              >
                <Edit size={18} />
                Edit Quotation
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button 
                onClick={onSave}
                disabled={items.length === 0}
                className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                {mode === 'edit' ? 'Save Changes' : 'Draft Quotation'}
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SalesDialog;
