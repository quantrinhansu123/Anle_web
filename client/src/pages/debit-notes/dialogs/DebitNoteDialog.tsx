import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, Plus, Hash, Ship, Calendar, Receipt, Trash2, DollarSign, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import type { DebitNoteFormState, DebitNoteInvoiceItem, DebitNoteChiHoItem } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  formState: DebitNoteFormState;
  setFormField: <K extends keyof DebitNoteFormState>(key: K, value: DebitNoteFormState[K]) => void;
  shipmentOptions: { value: string; label: string }[];
  onSave: () => void;
}

const DebitNoteDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  formState,
  setFormField,
  shipmentOptions,
  onSave,
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    shipment_id, note_date, invoice_items, chi_ho_items
  } = formState;

  const addInvoiceItem = () => {
    const newItem: DebitNoteInvoiceItem = {
      description: '',
      unit: '',
      rate: 0,
      quantity: 0,
      amount: 0,
      tax_percent: 0,
      total: 0
    };
    setFormField('invoice_items', [...invoice_items, newItem]);
  };

  const updateInvoiceItem = (index: number, field: keyof DebitNoteInvoiceItem, value: any) => {
    const newItems = [...invoice_items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amounts
    const rate = field === 'rate' ? Number(value) : (newItems[index].rate || 0);
    const qty = field === 'quantity' ? Number(value) : (newItems[index].quantity || 0);
    const tax = field === 'tax_percent' ? Number(value) : (newItems[index].tax_percent || 0);

    const amount = rate * qty;
    const total = amount * (1 + tax / 100);

    newItems[index].amount = amount;
    newItems[index].total = total;

    setFormField('invoice_items', newItems);
  };

  const removeInvoiceItem = (index: number) => {
    setFormField('invoice_items', invoice_items.filter((_, i) => i !== index));
  };

  const addChiHoItem = () => {
    const newItem: DebitNoteChiHoItem = {
      description: '',
      unit: '',
      rate: 0,
      quantity: 0,
      amount: 0,
      total: 0
    };
    setFormField('chi_ho_items', [...chi_ho_items, newItem]);
  };

  const updateChiHoItem = (index: number, field: keyof DebitNoteChiHoItem, value: any) => {
    const newItems = [...chi_ho_items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amounts
    const rate = field === 'rate' ? Number(value) : (newItems[index].rate || 0);
    const qty = field === 'quantity' ? Number(value) : (newItems[index].quantity || 0);

    const amount = rate * qty;
    newItems[index].amount = amount;
    newItems[index].total = amount;

    setFormField('chi_ho_items', newItems);
  };

  const removeChiHoItem = (index: number) => {
    setFormField('chi_ho_items', chi_ho_items.filter((_, i) => i !== index));
  };

  const totalInvoice = invoice_items.reduce((sum, it) => {
    const itemTotal = it.total || (it.rate * it.quantity * (1 + (it.tax_percent || 0) / 100));
    return sum + itemTotal;
  }, 0);

  const totalChiHo = chi_ho_items.reduce((sum, it) => {
    const itemTotal = it.total || (it.rate * it.quantity);
    return sum + itemTotal;
  }, 0);

  const grandTotal = totalInvoice + totalChiHo;

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
          'relative w-full max-w-[1000px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Receipt size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isDetailMode ? 'Debit Note Details' : isEditMode ? 'Edit Debit Note' : 'Add New Debit Note'}
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

          {/* TOP SECTION: GENERAL INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    disabled={isDetailMode}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Note Date</span>
              </div>
              <div className="p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground/70" />
                    <label className="text-[13px] font-bold text-foreground">Date <span className="text-red-500">*</span></label>
                  </div>
                  <DateInput
                    value={note_date || ''}
                    onChange={v => setFormField('note_date', v)}
                    disabled={isDetailMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: INVOICE ITEMS */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">INVOICE Items</span>
              </div>
              {!isDetailMode && (
                <button
                  onClick={addInvoiceItem}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-bold hover:bg-primary/20 transition-all"
                >
                  <Plus size={14} /> Add Item
                </button>
              )}
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-4 py-2 font-bold uppercase w-[25%]">Description</th>
                    <th className="px-4 py-2 font-bold uppercase w-[10%] text-center">Unit</th>
                    <th className="px-4 py-2 font-bold uppercase w-[12%] text-right">Rate</th>
                    <th className="px-4 py-2 font-bold uppercase w-[10%] text-right">Qty</th>
                    <th className="px-4 py-2 font-bold uppercase w-[12%] text-right text-primary">Amount</th>
                    <th className="px-4 py-2 font-bold uppercase w-[8%] text-right">Tax %</th>
                    <th className="px-4 py-2 font-bold uppercase w-[15%] text-right text-primary">Total</th>
                    {!isDetailMode && <th className="px-4 py-2 w-[5%]"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice_items.length === 0 ? (
                    <tr>
                      <td colSpan={isDetailMode ? 7 : 8} className="px-4 py-8 text-center text-[12px] text-muted-foreground italic">No invoice items added</td>
                    </tr>
                  ) : invoice_items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateInvoiceItem(idx, 'description', e.target.value)}
                          placeholder="Description"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-medium focus:outline-none transition-all disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => updateInvoiceItem(idx, 'unit', e.target.value)}
                          placeholder="Unit"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-medium text-center focus:outline-none transition-all disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={e => updateInvoiceItem(idx, 'rate', e.target.value)}
                          placeholder="0"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-bold text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={e => updateInvoiceItem(idx, 'quantity', e.target.value)}
                          placeholder="0"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-bold text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-[12px] font-bold text-primary tabular-nums">
                          {new Intl.NumberFormat('en-US').format(item.amount || (item.rate * item.quantity))}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.tax_percent || ''}
                          onChange={e => updateInvoiceItem(idx, 'tax_percent', e.target.value)}
                          placeholder="0"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-medium text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-[12px] font-black text-primary tabular-nums">
                          {new Intl.NumberFormat('en-US').format(item.total || (item.rate * item.quantity * (1 + (item.tax_percent || 0) / 100)))}
                        </span>
                      </td>
                      {!isDetailMode && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeInvoiceItem(idx)}
                            className="p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex justify-end">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Total Invoice</span>
                <span className="text-[15px] font-black text-primary tabular-nums">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(totalInvoice)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: CHI HO ITEMS */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-orange-500" />
                <span className="text-[12px] font-bold text-orange-600 uppercase tracking-wider">Disbursements</span>
              </div>
              {!isDetailMode && (
                <button
                  onClick={addChiHoItem}
                  className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[11px] font-bold hover:bg-orange-100 transition-all border border-orange-200"
                >
                  <Plus size={14} /> Add Item
                </button>
              )}
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="px-4 py-2 font-bold uppercase w-[35%]">Description</th>
                    <th className="px-4 py-2 font-bold uppercase w-[12%] text-center">Unit</th>
                    <th className="px-4 py-2 font-bold uppercase w-[15%] text-right">Rate</th>
                    <th className="px-4 py-2 font-bold uppercase w-[12%] text-right">Qty</th>
                    <th className="px-4 py-2 font-bold uppercase w-[18%] text-right text-orange-600 font-bold">Total</th>
                    {!isDetailMode && <th className="px-4 py-2 w-[8%]"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {chi_ho_items.length === 0 ? (
                    <tr>
                      <td colSpan={isDetailMode ? 5 : 6} className="px-4 py-8 text-center text-[12px] text-muted-foreground italic">No disbursement items added</td>
                    </tr>
                  ) : chi_ho_items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateChiHoItem(idx, 'description', e.target.value)}
                          placeholder="Description"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-medium focus:outline-none transition-all disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => updateChiHoItem(idx, 'unit', e.target.value)}
                          placeholder="Unit"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-medium text-center focus:outline-none transition-all disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.rate || ''}
                          onChange={e => updateChiHoItem(idx, 'rate', e.target.value)}
                          placeholder="0"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-bold text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={e => updateChiHoItem(idx, 'quantity', e.target.value)}
                          placeholder="0"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-bold text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-[12px] font-black text-orange-600 tabular-nums">
                          {new Intl.NumberFormat('en-US').format(item.total || (item.rate * item.quantity))}
                        </span>
                      </td>
                      {!isDetailMode && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeChiHoItem(idx)}
                            className="p-1.5 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-border bg-slate-50/50 flex justify-end">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Total Disbursements</span>
                <span className="text-[15px] font-black text-orange-600 tabular-nums">
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(totalChiHo)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Summary & Actions */}
        <div className="bg-white border-t border-border px-8 py-6 flex items-center justify-between shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-8">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
            >
              {isDetailMode ? 'Close' : 'Cancel'}
            </button>
            <div className="hidden md:flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Grand Total</span>
              <span className="text-2xl font-black text-primary tabular-nums leading-none">
                {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(grandTotal)}
              </span>
            </div>
          </div>

          {!isDetailMode && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-10 py-3 rounded-xl bg-primary text-white text-[14px] font-bold hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all group active:scale-95"
            >
              <Plus size={18} />
              {isEditMode ? 'Save Changes' : 'Create Debit Note'}
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DebitNoteDialog;
