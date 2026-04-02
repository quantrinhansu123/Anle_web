import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, FileText, Plus, Edit, ChevronRight, Hash, Package,
  DollarSign, Percent, Calculator, Info, Ship, MapPin, Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { Shipment } from '../../shipments/types';
import type { SalesFormState } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  mode: 'add' | 'edit' | 'detail';
  onClose: () => void;
  formState: SalesFormState;
  setFormField: <K extends keyof SalesFormState>(key: K, value: SalesFormState[K]) => void;
  shipmentOptions: (Shipment & { value: string; label: string })[];
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
  onSave,
  onEdit,
}) => {
  if (!isOpen && !isClosing) return null;

  const isReadOnly = mode === 'detail';

  const {
    shipment_id, description, rate, quantity,
    unit, currency, exchange_rate, tax_percent
  } = formState;

  // Calculations
  const subtotal = rate * quantity * exchange_rate;
  const taxValue = (subtotal * tax_percent) / 100;
  const total = subtotal + taxValue;

  const selectedShipment = formState.relatedShipment || shipmentOptions.find(s => s.value === shipment_id);

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
          'relative w-full max-w-[650px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
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
              {mode === 'add' ? 'Add New Sales Item' : mode === 'edit' ? 'Edit Sales Item' : 'Sales Item Details'}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION 1: SHIPMENT LINK */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <Ship size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Related Shipment</span>
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
                  disabled={isReadOnly}
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

          {/* SECTION 2: ITEM DETAILS */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Item details</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Description <span className="text-red-500">*</span></label>
                </div>
                <textarea
                  placeholder="Enter item description"
                  value={description || ''}
                  onChange={e => setFormField('description', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold min-h-[80px] disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Rate <span className="text-red-500">*</span></label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={rate || ''}
                    onChange={e => setFormField('rate', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Quantity <span className="text-red-500">*</span></label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={quantity || ''}
                    onChange={e => setFormField('quantity', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Unit <span className="text-red-500">*</span></label>
                  </div>
                  <input
                    type="text"
                    placeholder="E.g. Container, Set, Kg"
                    value={unit || ''}
                    onChange={e => setFormField('unit', e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Currency <span className="text-red-500">*</span></label>
                  </div>
                  <select
                    value={currency}
                    onChange={e => setFormField('currency', e.target.value as 'USD' | 'VND')}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Exchange Rate <span className="text-red-500">*</span></label>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="1.00"
                    value={exchange_rate || ''}
                    onChange={e => setFormField('exchange_rate', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Percent size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Tax (%) <span className="text-red-500">*</span></label>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={tax_percent || ''}
                    onChange={e => setFormField('tax_percent', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SUMMARY */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5 space-y-3">
             <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground font-medium">Tax Value:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(taxValue)} {currency}
                </span>
             </div>
             <div className="flex items-center justify-between border-t border-primary/10 pt-3">
                <span className="text-[15px] font-bold text-primary">Total Amount:</span>
                <span className="text-lg font-black text-primary tabular-nums">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(total)} {currency}
                </span>
             </div>
             <p className="text-[10px] text-muted-foreground italic text-right mt-2">
               Formula: Total = (Quantity * Rate * Exchange Rate) * (1 + Tax%)
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {isReadOnly ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all group active:scale-95"
            >
              <Edit size={18} />
              Edit Sales Item
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={onSave}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Plus size={18} />
              {mode === 'edit' ? 'Save Changes' : 'Create Sales Item'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SalesDialog;

