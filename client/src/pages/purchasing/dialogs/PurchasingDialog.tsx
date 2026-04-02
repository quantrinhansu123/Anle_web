import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Truck, Tag, Hash, Info, 
  Plus, ChevronRight, DollarSign, Calculator,
  User, Package, ClipboardList, Edit
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import type { PurchasingItem, CreatePurchasingItemDto } from '../../../services/purchasingService';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  mode: 'add' | 'edit' | 'detail';
  onClose: () => void;
  formState: Partial<PurchasingItem>;
  setFormField: (key: keyof CreatePurchasingItemDto, value: any) => void;
  shipmentOptions: { value: string; label: string }[];
  supplierOptions: { value: string; label: string }[];
  employeeOptions: { value: string; label: string }[];
  onSave: (pushToSales?: boolean) => void;
  onEdit?: () => void;
}

const PurchasingDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  mode,
  onClose,
  formState,
  setFormField,
  shipmentOptions,
  supplierOptions,
  employeeOptions,
  onSave,
  onEdit
}) => {
  const [calculatedTaxValue, setCalculatedTaxValue] = useState(0);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [pushToSales, setPushToSales] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPushToSales(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const rate = Number(formState.rate) || 0;
    const qty = Number(formState.quantity) || 0;
    const exRate = Number(formState.exchange_rate) || 0;
    const tax = Number(formState.tax_percent) || 0;

    const baseValue = rate * qty * exRate;
    const taxVal = (baseValue * tax) / 100;
    const total = baseValue + taxVal;

    setCalculatedTaxValue(taxVal);
    setCalculatedTotal(total);
  }, [formState.rate, formState.quantity, formState.exchange_rate, formState.tax_percent]);

  if (!isOpen && !isClosing) return null;

  const isDetailMode = mode === 'detail';
  const isEditMode = mode === 'edit';

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
          'relative w-full max-w-[600px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Truck size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === 'add' ? 'Add New Purchasing' : (mode === 'edit' ? 'Edit Purchasing' : 'Purchasing Details')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
            
            {/* Shipment ID */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Shipment <span className="text-red-500">*</span></label>
              </div>
              <SearchableSelect
                options={shipmentOptions}
                value={formState.shipment_id || ''}
                onValueChange={(v) => setFormField('shipment_id', v)}
                placeholder="Select shipment..."
                disabled={isDetailMode}
              />
            </div>

            {/* Supplier */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Supplier <span className="text-red-500">*</span></label>
              </div>
              <SearchableSelect
                options={supplierOptions}
                value={formState.supplier_id || ''}
                onValueChange={(v) => setFormField('supplier_id', v)}
                placeholder="Select supplier..."
                disabled={isDetailMode}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Description <span className="text-red-500">*</span></label>
              </div>
              <input
                type="text"
                placeholder="Item description"
                value={formState.description || ''}
                onChange={e => setFormField('description', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            {/* HS Code */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">HS Code</label>
              </div>
              <input
                type="text"
                placeholder="HS Code"
                value={formState.hs_code || ''}
                onChange={e => setFormField('hs_code', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rate */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Rate <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formState.rate || ''}
                  onChange={e => setFormField('rate', parseFloat(e.target.value) || 0)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Quantity <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formState.quantity || ''}
                  onChange={e => setFormField('quantity', parseFloat(e.target.value) || 0)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Unit <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="text"
                  placeholder="E.g. Container, Box"
                  value={formState.unit || ''}
                  onChange={e => setFormField('unit', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Currency <span className="text-red-500">*</span></label>
                </div>
                <select
                  value={formState.currency || 'USD'}
                  onChange={e => setFormField('currency', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                >
                  <option value="USD">USD</option>
                  <option value="VND">VND</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Exchange Rate */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Exchange Rate <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  value={formState.exchange_rate || ''}
                  onChange={e => setFormField('exchange_rate', parseFloat(e.target.value) || 0)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>

              {/* Tax % */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-muted-foreground/70" />
                  <label className="text-[13px] font-bold text-foreground">Tax (%) <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formState.tax_percent || ''}
                  onChange={e => setFormField('tax_percent', parseFloat(e.target.value) || 0)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
                />
              </div>
            </div>

            {/* Calculated Values */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tax Value</span>
                <span className="text-[15px] font-black text-primary tabular-nums">
                  {calculatedTaxValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Cost</span>
                <span className="text-[15px] font-black text-primary tabular-nums">
                  {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Personnel Assignments - PIC */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">PIC</label>
              </div>
              <SearchableSelect
                options={employeeOptions}
                value={formState.pic_id || ''}
                onValueChange={(v) => setFormField('pic_id', v)}
                placeholder="Select PIC..."
                disabled={isDetailMode}
              />
            </div>

            {/* Specification */}
            <div className="space-y-1.5 pt-4">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Specification</label>
              </div>
              <input
                type="text"
                placeholder="Item specification"
                value={formState.specification || ''}
                onChange={e => setFormField('specification', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-muted-foreground/70" />
                <label className="text-[13px] font-bold text-foreground">Note</label>
              </div>
              <textarea
                placeholder="Additional notes..."
                value={formState.note || ''}
                onChange={e => setFormField('note', e.target.value)}
                disabled={isDetailMode}
                className="w-full px-4 py-2 bg-muted/10 border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium min-h-[80px] resize-none disabled:bg-muted/5 disabled:text-muted-foreground"
              />
            </div>
            
            {/* ADD-ON FOR SALES QUOTATION */}
            {!isDetailMode && mode === 'add' && (
              <div className="mt-4 p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={pushToSales} 
                    onChange={(e) => setPushToSales(e.target.checked)}
                    className="w-4 h-4 rounded border-orange-300 text-orange-500 focus:ring-orange-500" 
                  />
                  <span className="text-[13px] font-bold text-orange-800">Generate corresponding Sales Quotation item</span>
                </label>
                {pushToSales && (
                  <p className="text-[11px] text-orange-700/80 pl-6 leading-relaxed">
                    By checking this, a mirrored Sales Quotation will automatically be created containing the same details. You can further edit its <b>Selling Price (Margin)</b> in the Sales module later.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm">
            {isDetailMode ? 'Close' : 'Cancel'}
          </button>
          
          {isDetailMode ? (
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Edit size={18} />
              Edit Purchasing
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={() => onSave(pushToSales)} 
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Plus size={18} />
              {isEditMode ? 'Save Changes' : (pushToSales ? 'Save & Push to Sales' : 'Create Purchasing')}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PurchasingDialog;
