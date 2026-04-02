import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, X, User, Hash, Calendar,
  Plus, ChevronRight, DollarSign, CreditCard,
  Building, Trash2, Receipt, Edit
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatCurrency, formatInputCurrency, parseCurrency } from '../../../lib/utils';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import type { PaymentRequestFormState } from '../types';
import type { Shipment } from '../../shipments/types';
import { Package, MapPin, Ship } from 'lucide-react';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isDetailMode?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  formState: PaymentRequestFormState;
  setFormField: <K extends keyof PaymentRequestFormState>(key: K, value: PaymentRequestFormState[K]) => void;
  shipmentOptions: (Shipment & { value: string; label: string })[];
  onSave: () => void;
}

const PaymentRequestDialog: React.FC<Props> = ({
  isOpen,
  isClosing,
  isEditMode,
  isDetailMode = false,
  onClose,
  onEdit,
  formState,
  setFormField,
  shipmentOptions,
  onSave
}) => {
  if (!isOpen && !isClosing) return null;

  const {
    shipment_id, request_date, account_name, account_number, 
    bank_name, invoices
  } = formState;

  const selectedShipment = formState.relatedShipment || shipmentOptions.find(s => s.value === shipment_id);

  const totalAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.payable_amount || 0), 0);
  }, [invoices]);

  const handleAddInvoice = () => {
    setFormField('invoices', [
      ...invoices,
      { no_invoice: '', description: '', date_issue: '', payable_amount: 0 }
    ]);
  };

  const handleRemoveInvoice = (index: number) => {
    setFormField('invoices', invoices.filter((_, i) => i !== index));
  };

  const handleUpdateInvoice = (index: number, field: string, value: any) => {
    const newInvoices = [...invoices];
    (newInvoices[index] as any)[field] = value;
    setFormField('invoices', newInvoices);
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
          'relative w-full max-w-[850px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border transition-transform duration-350 ease-out',
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-in slide-in-from-right duration-350',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileText size={20} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isDetailMode ? 'Payment Request Details' : isEditMode ? 'Edit Payment Request' : 'Add New Payment Request'}
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
                        setFormField('relatedShipment', selected);
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
                        <div className="w-full bg-blue-50/30 border-none rounded-lg py-1 px-3 text-[13px] font-medium text-blue-900/70 flex items-center gap-2">
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
                <Calendar size={14} className="text-primary" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Request Date</span>
              </div>
              <div className="p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Calendar size={14} className="text-primary/60" />
                    <label className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">Date <span className="text-red-500">*</span></label>
                  </div>
                  <DateInput
                    value={request_date}
                    onChange={v => setFormField('request_date', v)}
                    disabled={isDetailMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INVOICE ITEMS */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Receipt size={14} className="text-primary" />
                </div>
                <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Invoice Items</span>
              </div>
              {!isDetailMode && (
                <button
                  onClick={handleAddInvoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-all shadow-sm hover:shadow-primary/20"
                >
                  <Plus size={14} />
                  ADD INVOICE
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-border rounded-xl bg-slate-50/50">
                  <Receipt size={32} className="text-muted-foreground/20 mb-2" />
                  <p className="text-[13px] text-muted-foreground font-medium">No invoice items added yet</p>
                </div>
              ) : (
                invoices.map((inv, index) => (
                  <div key={index} className={clsx(
                    "p-4 rounded-xl border transition-all duration-300 relative group",
                    isDetailMode 
                      ? "bg-white border-border/40 hover:border-border/80" 
                      : "bg-slate-50/50 border-border/60 hover:bg-white hover:border-primary/30 hover:shadow-md"
                  )}>
                    {invoices.length > 1 && !isDetailMode && (
                      <button
                        onClick={() => handleRemoveInvoice(index)}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all shadow-md opacity-0 group-hover:opacity-100 z-10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Invoice No</label>
                        <input
                          type="text"
                          placeholder="INV-001"
                          value={inv.no_invoice || ''}
                          onChange={e => handleUpdateInvoice(index, 'no_invoice', e.target.value)}
                          disabled={isDetailMode}
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-slate-50 disabled:border-transparent disabled:text-slate-900"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Description</label>
                        <input
                          type="text"
                          placeholder="Description of item"
                          value={inv.description || ''}
                          onChange={e => handleUpdateInvoice(index, 'description', e.target.value)}
                          disabled={isDetailMode}
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium disabled:bg-slate-50 disabled:border-transparent disabled:text-slate-900"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Date Issue</label>
                        <DateInput
                          value={inv.date_issue || ''}
                          onChange={v => handleUpdateInvoice(index, 'date_issue', v)}
                          disabled={isDetailMode}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Payable Amount</label>
                        <div className="relative">
                          <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/40" />
                          <input
                            type="text"
                            placeholder="0.00"
                            value={isDetailMode ? formatCurrency(inv.payable_amount) : formatInputCurrency(inv.payable_amount || '')}
                            onChange={e => handleUpdateInvoice(index, 'payable_amount', parseCurrency(e.target.value))}
                            disabled={isDetailMode}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono font-bold text-primary disabled:bg-slate-50 disabled:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}

              <div className="pt-2 flex justify-end">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-4 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    <span className="text-[11px] font-black text-primary/60 uppercase tracking-[0.2em] relative z-10">Total Amount</span>
                    <span className="text-2xl font-black text-primary tabular-nums relative z-10">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: PAYMENT INFORMATION */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard size={14} className="text-primary" />
              </div>
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Payment Information</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <User size={14} className="text-primary/60" />
                  <label className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">Account Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Receiver account name"
                  value={account_name}
                  onChange={e => setFormField('account_name', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-slate-50 disabled:border-transparent disabled:text-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <Hash size={14} className="text-primary/60" />
                  <label className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">Account Number</label>
                </div>
                <input
                  type="text"
                  placeholder="Bank account number"
                  value={account_number}
                  onChange={e => setFormField('account_number', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:bg-slate-50 disabled:border-transparent disabled:text-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <Building size={14} className="text-primary/60" />
                  <label className="text-[12px] font-bold text-foreground/80 uppercase tracking-tight">Bank Name</label>
                </div>
                <input
                  type="text"
                  placeholder="Bank name and branch"
                  value={bank_name}
                  onChange={e => setFormField('bank_name', e.target.value)}
                  disabled={isDetailMode}
                  className="w-full px-4 py-2 bg-white border border-border rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium disabled:bg-slate-50 disabled:border-transparent disabled:text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-[13px] font-bold transition-all shadow-sm"
          >
            {isDetailMode ? 'Close' : 'Cancel'}
          </button>

          {isDetailMode && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all group active:scale-95"
            >
              <Edit size={16} />
              Edit Request
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
          {!isDetailMode && (
            <button 
              onClick={onSave}
              className="flex items-center gap-2 px-8 py-2 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group active:scale-95"
            >
              <Plus size={18} />
              {isEditMode ? 'Save Changes' : 'Create Payment Request'}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PaymentRequestDialog;
