import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, Plus, Hash, Ship, Calendar, Receipt, Trash2, DollarSign, ChevronRight, Edit
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import type { DebitNoteFormState, DebitNoteInvoiceItem, DebitNoteChiHoItem } from '../types';
import type { Shipment } from '../../shipments/types';
import type { ExchangeRate } from '../../../services/exchangeRateService';
import { Package, MapPin } from 'lucide-react';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  formState: DebitNoteFormState;
  setFormField: <K extends keyof DebitNoteFormState>(key: K, value: DebitNoteFormState[K]) => void;
  shipmentOptions: (Shipment & { value: string; label: string })[];
  exchangeRates: ExchangeRate[];
  onSave: () => void;
}

const DebitNoteDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  onEdit,
  formState,
  setFormField,
  shipmentOptions,
  exchangeRates,
  onSave,
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    shipment_id, note_date, invoice_items, chi_ho_items
  } = formState;

  const selectedShipment = formState.relatedShipment || shipmentOptions.find(s => s.value === shipment_id);

  const addInvoiceItem = () => {
    const newItem: DebitNoteInvoiceItem = {
      description: '',
      unit: '',
      currency_code: 'VND',
      exchange_rate: 1,
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
    const oldItem = newItems[index];
    newItems[index] = { ...oldItem, [field]: value };

    if (field === 'currency_code') {
      const oldExchangeRate = oldItem.exchange_rate || 1;
      let newExchangeRate = 1;

      if (value !== 'VND') {
        const rateObj = exchangeRates.find(r => r.currency_code === value);
        if (rateObj) newExchangeRate = rateObj.rate;
      }

      if (oldItem.rate > 0) {
        newItems[index].rate = parseFloat(((oldItem.rate * oldExchangeRate) / newExchangeRate).toFixed(4));
      }
      newItems[index].exchange_rate = newExchangeRate;
    }

    // Recalculate amounts
    const rate = newItems[index].rate || 0;
    const qty = field === 'quantity' ? Number(value) : (newItems[index].quantity || 0);
    const tax = field === 'tax_percent' ? Number(value) : (newItems[index].tax_percent || 0);
    const exchange = newItems[index].exchange_rate || 1;

    const amount = rate * qty;
    const total = amount * exchange * (1 + tax / 100);

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
      currency_code: 'VND',
      exchange_rate: 1,
      rate: 0,
      quantity: 0,
      amount: 0,
      total: 0
    };
    setFormField('chi_ho_items', [...chi_ho_items, newItem]);
  };

  const updateChiHoItem = (index: number, field: keyof DebitNoteChiHoItem, value: any) => {
    const newItems = [...chi_ho_items];
    const oldItem = newItems[index];
    newItems[index] = { ...oldItem, [field]: value };

    if (field === 'currency_code') {
      const oldExchangeRate = oldItem.exchange_rate || 1;
      let newExchangeRate = 1;

      if (value !== 'VND') {
        const rateObj = exchangeRates.find(r => r.currency_code === value);
        if (rateObj) newExchangeRate = rateObj.rate;
      }

      if (oldItem.rate > 0) {
        newItems[index].rate = parseFloat(((oldItem.rate * oldExchangeRate) / newExchangeRate).toFixed(4));
      }
      newItems[index].exchange_rate = newExchangeRate;
    }

    // Recalculate amounts
    const rate = newItems[index].rate || 0;
    const qty = field === 'quantity' ? Number(value) : (newItems[index].quantity || 0);
    const exchange = newItems[index].exchange_rate || 1;

    const amount = rate * qty;
    const total = amount * exchange;
    newItems[index].amount = amount;
    newItems[index].total = total;

    setFormField('chi_ho_items', newItems);
  };

  const removeChiHoItem = (index: number) => {
    setFormField('chi_ho_items', chi_ho_items.filter((_, i) => i !== index));
  };

  const totalInvoice = invoice_items.reduce((sum, it) => {
    const itemTotal = it.total || (it.rate * it.quantity * (it.exchange_rate || 1) * (1 + (it.tax_percent || 0) / 100));
    return sum + itemTotal;
  }, 0);

  const totalChiHo = chi_ho_items.reduce((sum, it) => {
    const itemTotal = it.total || (it.rate * it.quantity * (it.exchange_rate || 1));
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
          'relative w-full max-w-[1050px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
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

          {/* TOP SECTION: GENERAL INFO & SHIPMENT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
                <Ship size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Related Shipment</span>
              </div>
              <div className="p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Hash size={14} className="text-primary/60" />
                    <label className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">Select Shipment <span className="text-red-500">*</span></label>
                  </div>
                  <SearchableSelect
                    options={shipmentOptions}
                    value={shipment_id}
                    onValueChange={(v) => {
                      const selected = shipmentOptions.find(opt => opt.value === v);
                      setFormField('shipment_id', v);
                      if (selected) {
                        setFormField('relatedShipment' as any, selected);
                      }
                    }}
                    placeholder="Search shipment ID..."
                    disabled={isDetailMode}
                  />
                  {selectedShipment && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-blue-50 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-primary/60 uppercase tracking-wider flex items-center gap-1.5"><Package size={12} className="opacity-70" /> Commodity</label>
                        <input readOnly value={selectedShipment.commodity || '—'} className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 focus:ring-0 cursor-default" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-primary/60 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="opacity-70" /> Route (POL → POD)</label>
                        <div className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-bold text-blue-900 flex items-center gap-2">
                          <span>{selectedShipment.pol || '—'}</span>
                          <span className="opacity-30">→</span>
                          <span>{selectedShipment.pod || '—'}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-primary/60 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} className="opacity-70" /> ETD / ETA</label>
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

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Note Date</span>
              </div>
              <div className="p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Calendar size={14} className="text-primary/60" />
                    <label className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">Date <span className="text-red-500">*</span></label>
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
                    <th className="px-2 py-2 font-bold uppercase w-[18%]">Description</th>
                    <th className="px-2 py-2 font-bold uppercase w-[10%] text-center">Unit</th>
                    <th className="px-2 py-2 font-bold uppercase w-[9%] text-center">Curr</th>
                    <th className="px-2 py-2 font-bold uppercase w-[10%] text-right">Exc Rate</th>
                    <th className="px-2 py-2 font-bold uppercase w-[10%] text-right">Rate</th>
                    <th className="px-2 py-2 font-bold uppercase w-[8%] text-right">Qty</th>
                    <th className="px-2 py-2 font-bold uppercase w-[9%] text-right text-primary">Amount</th>
                    <th className="px-2 py-2 font-bold uppercase w-[8%] text-center">Tax %</th>
                    <th className="px-2 py-2 font-bold uppercase w-[14%] text-right text-primary">Total (VNĐ)</th>
                    {!isDetailMode && <th className="px-2 py-2 w-[4%]"></th>}
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
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-bold focus:outline-none transition-all disabled:hover:border-transparent"
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
                        <select
                          value={item.currency_code || 'VND'}
                          onChange={e => updateInvoiceItem(idx, 'currency_code', e.target.value)}
                          disabled={isDetailMode}
                          className="w-full px-1 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-bold text-center focus:outline-none transition-all disabled:hover:border-transparent text-slate-700"
                        >
                          <option value="VND">VND</option>
                          {exchangeRates.map(r => (
                            <option key={r.id} value={r.currency_code}>{r.currency_code}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.exchange_rate || ''}
                          onChange={e => updateInvoiceItem(idx, 'exchange_rate', e.target.value)}
                          placeholder="1"
                          disabled={isDetailMode || item.currency_code === 'VND'}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-bold text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
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
                      <td className="px-1 py-2">
                        <input
                          type="number"
                          value={item.tax_percent || ''}
                          onChange={e => updateInvoiceItem(idx, 'tax_percent', e.target.value)}
                          placeholder="0"
                          disabled={isDetailMode}
                          className="w-full px-1 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-white border rounded-lg text-[12px] font-bold text-center focus:outline-none transition-all tabular-nums disabled:hover:border-transparent text-slate-700"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-[12px] font-black text-primary tabular-nums">
                          {new Intl.NumberFormat('en-US').format(item.total || (item.rate * item.quantity * (item.exchange_rate || 1) * (1 + (item.tax_percent || 0) / 100)))}
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
                    <th className="px-4 py-2 font-bold uppercase w-[22%]">Description</th>
                    <th className="px-4 py-2 font-bold uppercase w-[11%] text-center">Unit</th>
                    <th className="px-4 py-2 font-bold uppercase w-[10%] text-center">Curr</th>
                    <th className="px-4 py-2 font-bold uppercase w-[10%] text-right">Exc Rate</th>
                    <th className="px-4 py-2 font-bold uppercase w-[12%] text-right">Rate</th>
                    <th className="px-4 py-2 font-bold uppercase w-[8%] text-right">Qty</th>
                    <th className="px-4 py-2 font-bold uppercase w-[20%] text-right text-orange-600 font-bold">Total (VNĐ)</th>
                    {!isDetailMode && <th className="px-4 py-2 w-[7%]"></th>}
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
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-bold focus:outline-none transition-all disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => updateChiHoItem(idx, 'unit', e.target.value)}
                          placeholder="Unit"
                          disabled={isDetailMode}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-bold text-center focus:outline-none transition-all disabled:hover:border-transparent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.currency_code || 'VND'}
                          onChange={e => updateChiHoItem(idx, 'currency_code', e.target.value)}
                          disabled={isDetailMode}
                          className="w-full px-1 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-bold text-center focus:outline-none transition-all disabled:hover:border-transparent text-slate-700"
                        >
                          <option value="VND">VND</option>
                          {exchangeRates.map(r => (
                            <option key={r.id} value={r.currency_code}>{r.currency_code}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.exchange_rate || ''}
                          onChange={e => updateChiHoItem(idx, 'exchange_rate', e.target.value)}
                          placeholder="1"
                          disabled={isDetailMode || item.currency_code === 'VND'}
                          className="w-full px-2 py-1.5 bg-transparent border-transparent hover:border-border/60 focus:border-orange-400/40 focus:bg-white border rounded-lg text-[12px] font-bold text-right focus:outline-none transition-all tabular-nums disabled:hover:border-transparent"
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
                          {new Intl.NumberFormat('en-US').format(item.total || (item.rate * item.quantity * (item.exchange_rate || 1)))}
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
              className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
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

          {isDetailMode && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all group active:scale-95"
            >
              <Edit size={18} />
              Edit Record
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

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
